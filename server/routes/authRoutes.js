const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Opportunity = require("../models/Opportunity");
const Referral = require("../models/Referral");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Only PDF and Word documents are allowed."));
    }
    cb(null, true);
  },
});

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

// PROFILE UPDATE
router.put("/profile", verifyToken, upload.single("resume"), async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      "name",
      "skills",
      "company",
      "designation",
      "yearsOfExperience",
      "bio",
      "linkedin",
      "github",
      "availability",
      "activeSlots",
      "maxCapacity",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.skills && typeof updates.skills === "string") {
      updates.skills = updates.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    if (updates.activeSlots && typeof updates.activeSlots === "string") {
      updates.activeSlots = updates.activeSlots
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean);
    }

    if (updates.yearsOfExperience) {
      updates.yearsOfExperience = Number(updates.yearsOfExperience) || 0;
    }

    if (updates.maxCapacity) {
      updates.maxCapacity = Number(updates.maxCapacity) || 10;
    }

    if (updates.availability !== undefined) {
      updates.availability = updates.availability === "true" || updates.availability === true;
    }

    if (req.file) {
      updates.resume = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Could not update profile.", error: err.message });
  }
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      skills,
      company,
      designation,
      yearsOfExperience,
      bio,
      linkedin,
      github,
      maxCapacity,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      skills,
      company,
      designation,
      yearsOfExperience,
      bio,
      linkedin,
      github,
      maxCapacity: Number(maxCapacity) || 10,
    });

    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json("User not found");

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json("Invalid credentials");

    const token = jwt.sign({ id: user._id }, "secret", {
      expiresIn: "1d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// GET ALL USERS (Backward compatibility)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// SMART REFERRER DIRECTORY (Phase 1: Rich profile, activity, opportunities & capacity)
router.get("/directory", async (req, res) => {
  try {
    const referrers = await User.find({ role: "referrer" })
      .select("-password")
      .sort({ points: -1, createdAt: -1 });

    const enriched = await Promise.all(
      referrers.map(async (ref) => {
        const obj = ref.toObject();

        // Count active pending/reviewing referrals
        const activeRequests = await Referral.countDocuments({
          referrer: ref._id,
          status: { $in: ["Pending", "Under Review", "Shortlisted"] },
        });

        // Total referrals handled
        const totalReferrals = await Referral.countDocuments({
          referrer: ref._id,
        });

        // Active opportunities posted by this referrer
        const opportunities = await Opportunity.find({
          referrer: ref._id,
          status: "Active",
        }).select("title role company requiredSkills maxApplications currentApplicationsCount");

        const capacity = obj.maxCapacity || 10;
        const remainingCapacity = Math.max(0, capacity - activeRequests);

        obj.activeRequestsCount = activeRequests;
        obj.totalReferralsHandled = totalReferrals;
        obj.maxCapacity = capacity;
        obj.remainingCapacity = remainingCapacity;
        obj.activeOpportunities = opportunities;
        obj.isAtCapacity = remainingCapacity === 0;

        return obj;
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch referrer directory", error: err.message });
  }
});

// LEADERBOARD (Top Referrers - Gamification / Wall of Fame)
router.get("/leaderboard", async (req, res) => {
  try {
    const referrers = await User.find({ role: "referrer" })
      .sort({ points: -1 })
      .limit(20)
      .select("name company designation points profileScore github linkedin maxCapacity");
    res.json(referrers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
});

module.exports = router;
