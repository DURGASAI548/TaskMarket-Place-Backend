
const mongoose = require('mongoose');

const evaluationPointSchema = new mongoose.Schema(
  {
    EvaluationPoint: {
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
  { 
    timestamps: true
  }
);

module.exports = mongoose.model('evaluationpoint', evaluationPointSchema);