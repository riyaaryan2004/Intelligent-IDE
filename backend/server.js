// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const codeRoutes = require('./src/api/routes/codeRoutes');
const testRoutes = require('./src/api/routes/testRoutes');
const debugRoutes = require('./src/api/routes/debugRoutes');
const projectRoutes = require('./src/api/routes/projectRoutes');
const authRoutes = require('./src/api/routes/authRoutes');

// Import middleware
const errorHandler = require('./src/api/middleware/errorHandler');
const auth = require('./src/api/middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/code', auth, codeRoutes);
app.use('/api/test', auth, testRoutes);
app.use('/api/debug', auth, debugRoutes);
app.use('/api/projects', auth, projectRoutes);

// Error handling
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

