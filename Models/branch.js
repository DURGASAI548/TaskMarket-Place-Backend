const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: true,
      trim: true,
    },

    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
    },

    branchAdminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default:null
    },

    branchDescription: {
      type: String,
      trim: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("branch", branchSchema);