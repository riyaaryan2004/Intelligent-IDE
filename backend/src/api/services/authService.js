// src/api/services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
}

class AuthService {
    async register(data) {
        try {
            const { username, email, password } = data;

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });

            if (existingUser) {
                throw new APIError(
                    'User with this email or username already exists',
                    400
                );
            }

            // Create new user
            const user = await User.create({
                username,
                email,
                password,
                role: 'user'
            });

            // Remove password from response
            user.password = undefined;

            return user;
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    async login(data) {
        try {
            const { email, password } = data;
     
            // Get user with password
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                throw new APIError('Invalid email or password', 401);
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new APIError('Invalid email or password', 401);
            }

            // Generate token
            const token = this.generateToken(user._id);

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Remove password from response
            user.password = undefined;

            return { user, token };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    async logout(token) {
        try {
            // You might want to implement token blacklisting here
            // For now, we'll just return success as JWT are stateless
            return true;
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    async getCurrentUser(userId) {
        try {
            const user = await User.findById(userId)
                .populate({
                    path: 'projects',
                    select: 'name description language'
                });

            if (!user) {
                throw new APIError('User not found', 404);
            }

            return user;
        } catch (error) {
            logger.error('Get current user error:', error);
            throw error;
        }
    }

    async updateProfile(userId, data) {
        try {
            const { username, email } = data;

            // Check if email is already taken
            if (email) {
                const existingUser = await User.findOne({ 
                    email, 
                    _id: { $ne: userId } 
                });
                if (existingUser) {
                    throw new APIError('Email already in use', 400);
                }
            }

            // Check if username is already taken
            if (username) {
                const existingUser = await User.findOne({ 
                    username, 
                    _id: { $ne: userId } 
                });
                if (existingUser) {
                    throw new APIError('Username already in use', 400);
                }
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { username, email } },
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new APIError('User not found', 404);
            }

            return user;
        } catch (error) {
            logger.error('Update profile error:', error);
            throw error;
        }
    }

    async changePassword(userId, data) {
        try {
            const { currentPassword, newPassword } = data;

            // Get user with password
            const user = await User.findById(userId).select('+password');

            if (!user) {
                throw new APIError('User not found', 404);
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                throw new APIError('Current password is incorrect', 401);
            }

            // Update password
            user.password = newPassword;
            await user.save();

            return true;
        } catch (error) {
            logger.error('Change password error:', error);
            throw error;
        }
    }

    async requestPasswordReset(email) {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                throw new APIError('User not found', 404);
            }

            // Generate reset token
            const resetToken = user.createPasswordResetToken();
            await user.save();

            // In a real application, send this token via email
            // For development, we'll just return it
            return resetToken;
        } catch (error) {
            logger.error('Request password reset error:', error);
            throw error;
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Hash the token for comparison
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Find user with valid token
            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                throw new APIError('Invalid or expired reset token', 400);
            }

            // Update password
            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            return true;
        } catch (error) {
            logger.error('Reset password error:', error);
            throw error;
        }
    }

    // Helper method to generate JWT
    generateToken(userId) {
        return jwt.sign(
            { userId },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }
}

module.exports = new AuthService();