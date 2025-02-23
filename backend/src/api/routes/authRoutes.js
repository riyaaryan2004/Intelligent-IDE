// src/api/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const validation = require('../middleware/validation');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', validation.validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await authService.register({
            username,
            email,
            password
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', validation.validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({
            email,
            password
        });
        res.json({ user, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        await authService.logout(req.token);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.user._id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
router.put('/profile', auth, validation.validateProfileUpdate, async (req, res) => {
    try {
        const { username, email } = req.body;
        const updated = await authService.updateProfile(req.user._id, {
            username,
            email
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Change password
router.put('/password', auth, validation.validatePasswordChange, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user._id, {
            currentPassword,
            newPassword
        });
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reset password request
router.post('/reset-password', validation.validateEmail, async (req, res) => {
    try {
        const { email } = req.body;
        await authService.requestPasswordReset(email);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reset password with token
router.post('/reset-password/:token', validation.validateNewPassword, async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;