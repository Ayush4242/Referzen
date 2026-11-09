const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
    },
    company: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    message: String,
    resume: String,
    portfolioUrl: String,
    githubUrl: String,
    linkedinUrl: String,

    matchScore: {
      type: Number,
      default: 0,
    },

    // AI-Assisted Candidate Evaluation results (Phase 3 & Phase 4)
    evaluation: {
      overallScore: { type: Number, default: 0 },
      breakdown: {
        skillAlignment: { type: Number, default: 0 },
        practicalExperience: { type: Number, default: 0 },
        workExperience: { type: Number, default: 0 },
        education: { type: Number, default: 0 },
        certifications: { type: Number, default: 0 },
      },
      strengths: [{ type: String }],
      gaps: [{ type: String }],
      summary: { type: String, default: "" },
      mandatoryRequirementsStatus: [
        {
          requirement: String,
          met: Boolean,
          notes: String,
        },
      ],
      evaluatedAt: Date,
      isAiEvaluated: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "Shortlisted",
        "Viewed",
        "Accepted",
        "Referred",
        "Interview",
        "Selected",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);
