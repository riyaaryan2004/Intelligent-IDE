// src/api/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const validation = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');

// Route handlers
const register = catchAsync(async (req, res) => {
    const { username, email, password } = req.body;
    const user = await authService.register({ username, email, password });
    res.status(201).json({
        status: 'success',
        data: { user }
    });
});


const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    res.json({
        status: 'success',
        data: { user, token }
    });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.token);
    res.json({
        status: 'success',
        message: 'Logged out successfully'
    });
});

const getCurrentUser = catchAsync(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);
    res.json({
        status: 'success',
        data: { user }
    });
});

const updateProfile = catchAsync(async (req, res) => {
    const { username, email } = req.body;
    const updated = await authService.updateProfile(req.user._id, { username, email });
    res.json({
        status: 'success',
        data: { user: updated }
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, { currentPassword, newPassword });
    res.json({
        status: 'success',
        message: 'Password updated successfully'
    });
});

const requestPasswordReset = catchAsync(async (req, res) => {
    await authService.requestPasswordReset(req.body.email);
    res.json({
        status: 'success',
        message: 'Password reset email sent'
    });
});

const resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.params.token, req.body.newPassword);
    res.json({
        status: 'success',
        message: 'Password reset successful'
    });
});

// Routes

router.post('/register', 
   validation.validateRegistration, 
    register
 );

router.post('/login', 
    validation.validateLogin, 
    login
);

router.post('/logout', 
    auth, 
    logout
);

router.get('/me', 
    auth, 
    getCurrentUser
);

router.put('/profile', 
    auth, 
    validation.validateRegistration, 
    updateProfile
);

router.put('/password', 
    auth, 
    validation.validateLogin, 
    changePassword
);

router.post('/reset-password', 
    validation.validateLogin, 
    requestPasswordReset
);

router.post('/reset-password/:token', 
    validation.validateLogin, 
    resetPassword
);

module.exports = router;