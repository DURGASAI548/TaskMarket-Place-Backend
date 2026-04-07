const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    displayName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileURL: {
      type: String,
      default:null
    },
    rollNo: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: Number,
      required: true,
    },
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    branch: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
    },
    userType: {
      type: String,
      enum: ["superAdmin", "orgAdmin", "branchaAdmin", "user"], 
      default: "user",
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bankaccount", 
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

module.exports = mongoose.model("user", userSchema);