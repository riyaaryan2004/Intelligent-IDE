// backend/src/models/TestCase.js
const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  codeSnippet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeSnippet',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  testCode: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['unit', 'integration', 'e2e'],
    default: 'unit'
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'pending'],
    default: 'pending'
  },
  results: {
    passed: Boolean,
    duration: Number,
    errorMessage: String,
    coverage: {
      lines: Number,
      functions: Number,
      branches: Number
    }
  }
}, {
  timestamps: true
});

const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;
