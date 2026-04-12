const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    orgName: {
      type: String,
      required: true,
      trim: true,
    },

    orgDescription: {
      type: String,
      trim: true,
    },

    orgAdminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
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

module.exports = mongoose.model("organization", organizationSchema);