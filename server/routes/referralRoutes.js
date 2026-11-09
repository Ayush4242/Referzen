const router = require("express").Router();
const jwt = require("jsonwebtoken");

const Referral = require("../models/Referral");
const User = require("../models/User");
const Opportunity = require("../models/Opportunity");
const { evaluateCandidateWithAI } = require("./aiRoutes");

const ALLOWED_STATUS_UPDATES = [
  "Pending",
  "Under Review",
  "Shortlisted",
  "Accepted",
  "Interview",
  "Selected",
  "Rejected",
];

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

// CREATE REFERRAL APPLICATION / REQUEST
router.post("/create", async (req, res) => {
  try {
    const {
      student,
      referrer,
      opportunity,
      company,
      jobRole,
      message,
      resume,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
    } = req.body;

    if (!student || !referrer) {
      return res.status(400).json({ message: "Student and Referrer IDs are required" });
    }

    // FIND USERS
    const studentUser = await User.findById(student);
    const referrerUser = await User.findById(referrer);

    if (!studentUser) {
      return res.status(404).json({ message: "Student user not found" });
    }
    if (!referrerUser) {
      return res.status(404).json({ message: "Referrer user not found" });
    }

    let oppDoc = null;

    if (opportunity) {
      oppDoc = await Opportunity.findById(opportunity);
      if (!oppDoc) {
        return res.status(404).json({ message: "Referral opportunity not found" });
      }

      if (oppDoc.status !== "Active") {
        return res.status(400).json({
          message: `This opportunity is currently ${oppDoc.status.toLowerCase()} and cannot accept new applications.`,
        });
      }

      // Check capacity
      const currentCount = await Referral.countDocuments({ opportunity: oppDoc._id });
      if (currentCount >= (oppDoc.maxApplications || 10)) {
        return res.status(400).json({
          message: "This opportunity has reached its maximum application capacity.",
        });
      }

      // Check duplicate application
      const existingApp = await Referral.findOne({
        student: studentUser._id,
        opportunity: oppDoc._id,
      });
      if (existingApp) {
        return res.status(409).json({
          message: "You have already submitted an application for this opportunity.",
        });
      }
    } else {
      // Direct referral request capacity check
      if (!referrerUser.availability) {
        return res.status(400).json({
          message: "This referrer is currently unavailable for direct requests.",
        });
      }

      const activeDirectCount = await Referral.countDocuments({
        referrer: referrerUser._id,
        status: { $in: ["Pending", "Under Review"] },
      });
      const capacity = referrerUser.maxCapacity || 10;
      if (activeDirectCount >= capacity) {
        return res.status(400).json({
          message: "This referrer has reached their current request capacity.",
        });
      }
    }

    // AI-Assisted Candidate Evaluation (Phase 3 & Phase 4)
    let evaluationResult = null;
    let score = 0;

    try {
      const evaluationOpp = oppDoc || {
        title: jobRole || "Software Engineer",
        company: company || referrerUser.company || "Tech Company",
        role: jobRole || "Software Engineering",
        description: message || "General referral request",
        requiredSkills: referrerUser.skills || [],
        minExperience: 0,
        educationRequirements: "Technical degree or equivalent",
      };

      const candData = {
        name: studentUser.name,
        email: studentUser.email,
        skills: studentUser.skills || [],
        yearsOfExperience: studentUser.yearsOfExperience || 0,
        bio: studentUser.bio || "",
        linkedin: linkedinUrl || studentUser.linkedin || "",
        github: githubUrl || studentUser.github || "",
        resume: resume || studentUser.resume || "",
      };

      evaluationResult = await evaluateCandidateWithAI({
        candidate: candData,
        opportunity: evaluationOpp,
        applicationMessage: message,
      });

      score = evaluationResult?.overallScore || 0;
    } catch (evalErr) {
      console.warn("Error running AI candidate evaluation on create:", evalErr.message);
    }

    // CREATE REFERRAL RECORD
    const referral = await Referral.create({
      student,
      referrer,
      opportunity: oppDoc ? oppDoc._id : undefined,
      company: company || oppDoc?.company || referrerUser.company || "Company",
      jobRole: jobRole || oppDoc?.title || "Software Engineer",
      message,
      resume: resume || studentUser.resume || "",
      portfolioUrl: portfolioUrl || "",
      githubUrl: githubUrl || studentUser.github || "",
      linkedinUrl: linkedinUrl || studentUser.linkedin || "",
      matchScore: score,
      evaluation: evaluationResult || undefined,
      status: "Pending",
    });

    if (oppDoc) {
      oppDoc.currentApplicationsCount = (oppDoc.currentApplicationsCount || 0) + 1;
      await oppDoc.save();
    }

    await referral.populate("referrer student opportunity");
    res.status(201).json(referral);
  } catch (err) {
    console.error("Error creating referral:", err);
    res.status(500).json({ message: "Failed to create referral application", error: err.message });
  }
});

// GET ALL REFERRALS
router.get("/", async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("student")
      .populate("referrer")
      .populate("opportunity");

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch referrals", error: err.message });
  }
});

// GET APPLICATIONS FOR A SPECIFIC OPPORTUNITY (Referrer only)
router.get("/opportunity/:opportunityId", verifyToken, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.opportunityId);
    if (!opp) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (String(opp.referrer) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied. Only the opportunity owner can review applicants." });
    }

    const applications = await Referral.find({ opportunity: opp._id })
      .populate("student", "name email skills yearsOfExperience bio linkedin github resume profileScore")
      .populate("opportunity")
      .sort({ matchScore: -1, createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch opportunity applications", error: err.message });
  }
});

// GET SINGLE APPLICATION BY ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate("student", "name email skills yearsOfExperience bio linkedin github resume profileScore")
      .populate("referrer", "name company designation email")
      .populate("opportunity");

    if (!referral) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Authorization: only student or assigned referrer can view
    const isOwner =
      String(referral.student?._id) === String(req.user.id) ||
      String(referral.referrer?._id) === String(req.user.id);

    if (!isOwner) {
      return res.status(403).json({ message: "Unauthorized to view this application." });
    }

    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch application", error: err.message });
  }
});

// UPDATE APPLICATION STATUS (Phase 6 - Referrer Only)
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS_UPDATES.includes(status)) {
      return res.status(400).json({ message: `Invalid status update. Allowed: ${ALLOWED_STATUS_UPDATES.join(", ")}` });
    }

    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: "Referral not found." });
    }

    const actingUser = await User.findById(req.user.id);
    if (!actingUser || actingUser.role !== "referrer") {
      return res.status(403).json({ message: "Only referrers can update status." });
    }

    if (String(referral.referrer) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the assigned referrer can update this referral." });
    }

    const previousStatus = referral.status;
    referral.status = status;
    await referral.save();

    // Reward points for active engagement
    if (status === "Shortlisted" && previousStatus !== "Shortlisted") {
      actingUser.points = (actingUser.points || 0) + 2;
    }
    if (status === "Accepted" && previousStatus !== "Accepted") {
      actingUser.points = (actingUser.points || 0) + 5;
    }
    if (status === "Interview" && previousStatus !== "Interview") {
      actingUser.points = (actingUser.points || 0) + 10;
    }
    if (status === "Selected" && previousStatus !== "Selected") {
      actingUser.points = (actingUser.points || 0) + 50;
    }

    if (["Shortlisted", "Accepted", "Interview", "Selected"].includes(status)) {
      await actingUser.save();
    }

    await referral.populate("referrer student opportunity");
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
});

// TRIGGER / RE-TRIGGER AI EVALUATION FOR A REFERRAL
router.post("/:id/evaluate", verifyToken, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate("student")
      .populate("opportunity");

    if (!referral) {
      return res.status(404).json({ message: "Referral application not found" });
    }

    if (String(referral.referrer) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the assigned referrer can run evaluation." });
    }

    const opp = referral.opportunity || {
      title: referral.jobRole,
      company: referral.company,
      description: referral.message || "General referral opportunity",
      requiredSkills: [],
      minExperience: 0,
    };

    const candData = {
      name: referral.student?.name,
      email: referral.student?.email,
      skills: referral.student?.skills || [],
      yearsOfExperience: referral.student?.yearsOfExperience || 0,
      bio: referral.student?.bio || "",
      linkedin: referral.linkedinUrl || referral.student?.linkedin,
      github: referral.githubUrl || referral.student?.github,
      resume: referral.resume || referral.student?.resume,
    };

    const evaluation = await evaluateCandidateWithAI({
      candidate: candData,
      opportunity: opp,
      applicationMessage: referral.message,
    });

    referral.evaluation = evaluation;
    referral.matchScore = evaluation.overallScore;
    await referral.save();

    await referral.populate("student referrer opportunity");
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: "Evaluation failed", error: err.message });
  }
});

// STUDENT REFERRALS
router.get("/student/:id", async (req, res) => {
  try {
    const referrals = await Referral.find({
      student: req.params.id,
    })
      .populate("referrer")
      .populate("opportunity")
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student referrals", error: err.message });
  }
});

// REFERRER REFERRALS
router.get("/referrer/:id", async (req, res) => {
  try {
    const referrals = await Referral.find({
      referrer: req.params.id,
    })
      .populate("student")
      .populate("referrer")
      .populate("opportunity")
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch referrer referrals", error: err.message });
  }
});

module.exports = router;
