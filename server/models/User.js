const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["student", "referrer", "admin"],
      default: "student",
    },
    skills: [String],
    company: String,
    designation: String,
    yearsOfExperience: Number,
    bio: String,
    linkedin: String,
    github: String,
    availability: {
      type: Boolean,
      default: true,
    },
    maxCapacity: {
      type: Number,
      default: 10,
    },
    resume: String,
    points: {
      type: Number,
      default: 0,
    },
    activeSlots: [String],
    profileScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
