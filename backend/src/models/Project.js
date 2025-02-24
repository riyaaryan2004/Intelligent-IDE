// backend/src/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  codeSnippets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeSnippet'
  }],
  testCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase'
  }],
  settings: {
    type: Map,
    of: String,
    default: {}
  },
  collaborators: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
      role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' } // Optional role
    }
  ]
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
