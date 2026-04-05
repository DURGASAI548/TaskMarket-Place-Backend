// models/Tag.js
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    TagName: {
      type: String,
      required: true,
    },
    AddedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    UpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('tag', tagSchema);