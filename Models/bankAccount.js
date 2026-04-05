const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    ifsc: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    accountNo: {
      type: Number,
      required: true,
      unique: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    branchName: {
      type: String,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
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

module.exports = mongoose.model("bankaccount", bankAccountSchema);