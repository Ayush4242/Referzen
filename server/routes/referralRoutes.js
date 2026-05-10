const router = require("express").Router();
const jwt = require("jsonwebtoken");

const Referral = require("../models/Referral");
const User = require("../models/User");

const ALLOWED_STATUS_UPDATES = ["Accepted", "Interview", "Selected", "Rejected"];

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
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


// CREATE REFERRAL REQUEST
router.post("/create", async (req, res) => {
  try {
    const {
      student,
      referrer,
      company,
      jobRole,
      message,
      resume,
    } = req.body;

    // FIND USERS
    const studentUser = await User.findById(student);
    const referrerUser = await User.findById(referrer);

    // SMART MATCH SCORE
    let score = 0;

    studentUser.skills.forEach((skill) => {
      if (referrerUser.skills.includes(skill)) {
        score += 20;
      }
    });

    if (score > 100) score = 100;

    // CREATE REFERRAL
    const referral = await Referral.create({
      student,
      referrer,
      company,
      jobRole,
      message,
      resume,
      matchScore: score,
    });

    res.json(referral);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// GET ALL REFERRALS
router.get("/", async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("student")
      .populate("referrer");

    res.json(referrals);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// UPDATE STATUS
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS_UPDATES.includes(status)) {
      return res.status(400).json({ message: "Invalid status update." });
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

    if (status === "Accepted" && previousStatus !== "Accepted") {
      actingUser.points = (actingUser.points || 0) + 5;
    }

    if (status === "Interview" && previousStatus !== "Interview") {
      actingUser.points = (actingUser.points || 0) + 10;
    }

    if (status === "Selected" && previousStatus !== "Selected") {
      actingUser.points = (actingUser.points || 0) + 50;
    }

    if (["Accepted", "Interview", "Selected"].includes(status)) {
      await actingUser.save();
    }

    await referral.populate("referrer student");
    res.json(referral);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
router.get("/student/:id", async (req, res) => {
  try {
    const referrals = await Referral.find({
      student: req.params.id,
    }).populate("referrer");

    res.json(referrals);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get("/referrer/:id", async (req, res) => {
  try {
    const referrals = await Referral.find({
      referrer: req.params.id,
    })
      .populate("student")
      .populate("referrer");

    res.json(referrals);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;