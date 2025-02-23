// src/api/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const validation = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { validateRequest } = require('../middleware/requestValidator');

router.post('/register',
    validateRequest(validation.registrationSchema),
    catchAsync(async (req, res) => {
        const { username, email, password } = req.body;
        const user = await authService.register({ username, email, password });
        res.status(201).json({
            status: 'success',
            data: { user }
        });
    })
);

router.post('/login',
    validateRequest(validation.loginSchema),
    catchAsync(async (req, res) => {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });
        res.json({
            status: 'success',
            data: { user, token }
        });
    })
);

router.post('/logout',
    auth,
    catchAsync(async (req, res) => {
        await authService.logout(req.token);
        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    })
);

router.get('/me',
    auth,
    catchAsync(async (req, res) => {
        const user = await authService.getCurrentUser(req.user._id);
        res.json({
            status: 'success',
            data: { user }
        });
    })
);

router.put('/profile',
    auth,
    validateRequest(validation.profileUpdateSchema),
    catchAsync(async (req, res) => {
        const { username, email } = req.body;
        const updated = await authService.updateProfile(req.user._id, { username, email });
        res.json({
            status: 'success',
            data: { user: updated }
        });
    })
);

router.put('/password',
    auth,
    validateRequest(validation.passwordChangeSchema),
    catchAsync(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user._id, { currentPassword, newPassword });
        res.json({
            status: 'success',
            message: 'Password updated successfully'
        });
    })
);

router.post('/reset-password',
    validateRequest(validation.emailSchema),
    catchAsync(async (req, res) => {
        await authService.requestPasswordReset(req.body.email);
        res.json({
            status: 'success',
            message: 'Password reset email sent'
        });
    })
);

router.post('/reset-password/:token',
    validateRequest(validation.resetPasswordSchema),
    catchAsync(async (req, res) => {
        await authService.resetPassword(req.params.token, req.body.newPassword);
        res.json({
            status: 'success',
            message: 'Password reset successful'
        });
    })
);

module.exports = router;