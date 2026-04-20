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
      default: null,
    },
    displayName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      default: null,
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
      default:null
    },
    branch: {
     type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      default:null
    },
    userType: {
      type: String,
      enum: ["superAdmin", "orgAdmin", "branchAdmin", "user"], 
      default: "user",
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bankaccount", 
    },
    otp:{
      type: Number,
      default:null,
    },
    otpCreatedAt:{
      type: Date,
      default: null
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