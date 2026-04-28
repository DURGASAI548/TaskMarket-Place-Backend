// models/Submission.js
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    TaskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task',
      required: true,
    },
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    RegisteredAt: {
      type: Date,
      required:true
    }
  },
  { timestamps: true }
);
registrationSchema.index({ TaskID: 1, UserID: 1 }, { unique: true });
module.exports = mongoose.model('registration', registrationSchema);