const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    company: String,

    jobRole: String,

    message: String,

    resume: String,

    matchScore: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
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