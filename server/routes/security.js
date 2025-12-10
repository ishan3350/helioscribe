const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/security/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
], protect, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user registered with Google - ONLY check the registeredWithGoogle boolean field
    if (user.registeredWithGoogle === true) {
      return res.status(403).json({
        success: false,
        message: 'This account was registered using Google. Password changes are not available for Google accounts.'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password'
      });
    }

    // Update password - hash it manually to ensure it's encrypted
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Password has been changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// @route   GET /api/security/mfa/setup
// @desc    Generate MFA secret and QR code
// @access  Private
router.get('/mfa/setup', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate a secret for the user
    const secret = speakeasy.generateSecret({
      name: `HelioScribe (${user.email})`,
      issuer: 'HelioScribe'
    });

    // Generate backup codes (10 codes) - 6-digit numbers only
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      // Generate a random 6-digit number (100000 to 999999)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      backupCodes.push(code);
    }

    // Store secret temporarily (don't enable MFA yet - user needs to verify first)
    user.mfaSecret = secret.base32;
    user.mfaBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during MFA setup'
    });
  }
});

// @route   POST /api/security/mfa/verify
// @desc    Verify MFA code and enable MFA
// @access  Private
router.post('/mfa/verify', [
  body('token')
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
    .matches(/^\d+$/).withMessage('Verification code must contain only numbers')
], protect, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.body;

    const user = await User.findById(req.user._id).select('+mfaSecret +mfaBackupCodes');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA secret not found. Please set up MFA first.'
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) before/after current time
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'MFA has been enabled successfully',
      data: {
        backupCodes: user.mfaBackupCodes || []
      }
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during MFA verification'
    });
  }
});

// @route   POST /api/security/mfa/disable
// @desc    Disable MFA for user
// @access  Private
router.post('/mfa/disable', [
  body('password')
    .notEmpty().withMessage('Password is required to disable MFA')
], protect, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password +mfaSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user registered with Google - ONLY check the registeredWithGoogle boolean field
    if (user.registeredWithGoogle === true) {
      return res.status(403).json({
        success: false,
        message: 'This account was registered using Google. Please sign in with Google to manage MFA.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Disable MFA and clear secret
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = [];
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'MFA has been disabled successfully'
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during MFA disable'
    });
  }
});

// @route   GET /api/security/mfa/status
// @desc    Get MFA status for user
// @access  Private
router.get('/mfa/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        mfaEnabled: user.mfaEnabled || false,
        hasSecret: !!user.mfaSecret
      }
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting MFA status'
    });
  }
});

module.exports = router;

