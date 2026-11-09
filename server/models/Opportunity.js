const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Software Engineer",
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: [
      {
        type: String,
      },
    ],
    minExperience: {
      type: Number,
      default: 0,
    },
    maxExperience: {
      type: Number,
    },
    educationRequirements: {
      type: String,
      default: "Bachelor's degree in Computer Science, Engineering, or relevant practical experience",
    },
    maxApplications: {
      type: Number,
      default: 10,
    },
    currentApplicationsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Closed"],
      default: "Active",
    },
    // Configurable evaluation weights (Phase 4)
    weights: {
      skillAlignment: { type: Number, default: 35 },
      practicalExperience: { type: Number, default: 25 },
      workExperience: { type: Number, default: 20 },
      education: { type: Number, default: 10 },
      certifications: { type: Number, default: 10 },
    },
    mandatoryRequirements: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
