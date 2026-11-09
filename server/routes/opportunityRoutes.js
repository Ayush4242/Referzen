const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Opportunity = require("../models/Opportunity");
const Referral = require("../models/Referral");
const User = require("../models/User");

// JWT verification middleware
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

// GET ALL OPPORTUNITIES (with filters)
router.get("/", async (req, res) => {
  try {
    const { company, role, skill, status = "Active" } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }
    if (company) {
      filter.company = new RegExp(company, "i");
    }
    if (role) {
      filter.role = new RegExp(role, "i");
    }
    if (skill) {
      filter.requiredSkills = { $in: [new RegExp(skill, "i")] };
    }

    const opportunities = await Opportunity.find(filter)
      .populate("referrer", "name company designation availability points profileScore linkedin github activeSlots maxCapacity")
      .sort({ createdAt: -1 });

    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch opportunities", error: err.message });
  }
});

// GET MY OPPORTUNITIES (Referrer only)
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ referrer: req.user.id })
      .sort({ createdAt: -1 });

    // Attach real-time application count
    const enriched = await Promise.all(
      opportunities.map(async (opp) => {
        const count = await Referral.countDocuments({ opportunity: opp._id });
        const obj = opp.toObject();
        obj.currentApplicationsCount = count;
        return obj;
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your opportunities", error: err.message });
  }
});

// GET SINGLE OPPORTUNITY
router.get("/:id", async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id).populate(
      "referrer",
      "name company designation availability points profileScore linkedin github maxCapacity"
    );

    if (!opp) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const appCount = await Referral.countDocuments({ opportunity: opp._id });
    const result = opp.toObject();
    result.currentApplicationsCount = appCount;

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch opportunity", error: err.message });
  }
});

// CREATE OPPORTUNITY (Referrer only)
router.post("/create", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "referrer") {
      return res.status(403).json({ message: "Only referrers can create opportunities" });
    }

    const {
      company,
      title,
      role,
      description,
      requiredSkills,
      minExperience,
      maxExperience,
      educationRequirements,
      maxApplications,
      weights,
      mandatoryRequirements,
    } = req.body;

    if (!company || !title || !description) {
      return res.status(400).json({ message: "Company, title, and description are required" });
    }

    const parsedSkills = Array.isArray(requiredSkills)
      ? requiredSkills
      : typeof requiredSkills === "string"
      ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedMandatory = Array.isArray(mandatoryRequirements)
      ? mandatoryRequirements
      : typeof mandatoryRequirements === "string"
      ? mandatoryRequirements.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const opportunity = await Opportunity.create({
      referrer: req.user.id,
      company: company || user.company,
      title,
      role: role || "Software Engineer",
      description,
      requiredSkills: parsedSkills,
      minExperience: Number(minExperience) || 0,
      maxExperience: maxExperience ? Number(maxExperience) : undefined,
      educationRequirements:
        educationRequirements ||
        "Bachelor's degree in CS, Engineering, or relevant technical experience",
      maxApplications: Number(maxApplications) || 10,
      weights: weights || {
        skillAlignment: 35,
        practicalExperience: 25,
        workExperience: 20,
        education: 10,
        certifications: 10,
      },
      mandatoryRequirements: parsedMandatory,
      status: "Active",
    });

    res.status(201).json(opportunity);
  } catch (err) {
    res.status(500).json({ message: "Failed to create opportunity", error: err.message });
  }
});

// UPDATE OPPORTUNITY (Referrer only)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (String(opp.referrer) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own opportunities" });
    }

    const updates = req.body;
    if (updates.requiredSkills && typeof updates.requiredSkills === "string") {
      updates.requiredSkills = updates.requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (updates.mandatoryRequirements && typeof updates.mandatoryRequirements === "string") {
      updates.mandatoryRequirements = updates.mandatoryRequirements
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update opportunity", error: err.message });
  }
});

// UPDATE OPPORTUNITY STATUS (Active / Paused / Closed)
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Paused", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    if (String(opp.referrer) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only update your own opportunities" });
    }

    opp.status = status;
    await opp.save();

    res.json(opp);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err.message });
  }
});

module.exports = router;
