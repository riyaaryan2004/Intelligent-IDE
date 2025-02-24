// backend/src/models/CodeSnippet.js
const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  analysis: {
    improvements: { type: [String], default: [] }, // Changed to array of strings
    bugs: { type: [String], default: [] },
    securityIssues: { type: [String], default: [] },
    recommendations: { type: [String], default: [] }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  history: [{
    version: Number,
    code: String,
    changes: String,
    timestamp: Date
  }]
}, {
  timestamps: true
});

const CodeSnippet = mongoose.model('CodeSnippet', codeSnippetSchema);
module.exports = CodeSnippet;