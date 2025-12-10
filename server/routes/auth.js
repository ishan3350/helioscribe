const express = require('express');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateResetToken = require('../utils/generateResetToken');
const sendEmail = require('../utils/sendEmail');
const { getVerificationEmailTemplate, getPasswordResetEmailTemplate } = require('../utils/emailTemplates');
const { protect } = require('../middleware/auth');
const verifyRecaptcha = require('../utils/verifyRecaptcha');
const { verifyGoogleToken } = require('../utils/googleAuth');

const router = express.Router();

// Environment variables for OAuth
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${BACKEND_URL}/api/auth/google/callback`;
const GOOGLE_REDIRECT_URI_REGISTER = process.env.GOOGLE_REDIRECT_URI_REGISTER || `${BACKEND_URL}/api/auth/google/callback/register`;

// OAuth2Client for login
const oauth2ClientLogin = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// OAuth2Client for registration
const oauth2ClientRegister = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI_REGISTER
);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('howHeard')
    .trim()
    .notEmpty().withMessage('Please specify how you heard about us')
    .isIn(['Reddit', 'Search Engine', 'Friend', 'AI Chat Bot', 'Social Media', 'Ad', 'Other']).withMessage('Please select a valid option'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, address, howHeard, password, deviceFingerprint, recaptchaToken } = req.body;

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification is required'
      });
    }

    // Get client IP address for reCAPTCHA verification
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Verify reCAPTCHA (v3 will check score automatically)
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIP);
    
    if (!recaptchaResult.success) {
      console.error('reCAPTCHA verification failed for registration:', {
        error: recaptchaResult.error,
        errorCodes: recaptchaResult.errorCodes,
        ip: clientIP
      });
      
      // Provide user-friendly error message
      let userMessage = 'reCAPTCHA verification failed. Please try again.';
      if (recaptchaResult.errorCodes && recaptchaResult.errorCodes.includes('invalid-input-secret')) {
        userMessage = 'reCAPTCHA configuration error. Please contact support.';
      } else if (recaptchaResult.errorCodes && recaptchaResult.errorCodes.includes('invalid-input-response')) {
        userMessage = 'reCAPTCHA verification expired. Please complete the verification again.';
      }
      
      return res.status(400).json({
        success: false,
        message: userMessage
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      address,
      howHeard,
      password,
      registrationIP: clientIP,
      deviceFingerprint: deviceFingerprint || null
    });

    // Generate verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - HelioScribe',
        html: getVerificationEmailTemplate(user.firstName, verificationCode)
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email with code
// @access  Public
router.post('/verify-email', [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('code')
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, code } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerificationCode +emailVerificationCodeExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (!user.emailVerificationCode || !user.emailVerificationCodeExpire) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not found. Please request a new one.'
      });
    }

    if (user.emailVerificationCodeExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification code
// @access  Public
router.post('/resend-verification', [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - HelioScribe',
        html: getVerificationEmailTemplate(user.firstName, verificationCode)
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification is required'
      });
    }

    // Get client IP address for reCAPTCHA verification
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Verify reCAPTCHA (v3 will check score automatically)
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIP);
    
    if (!recaptchaResult.success) {
      console.error('reCAPTCHA verification failed for login:', {
        error: recaptchaResult.error,
        errorCodes: recaptchaResult.errorCodes,
        ip: clientIP
      });
      
      // Provide user-friendly error message
      let userMessage = 'reCAPTCHA verification failed. Please try again.';
      if (recaptchaResult.errorCodes && recaptchaResult.errorCodes.includes('invalid-input-secret')) {
        userMessage = 'reCAPTCHA configuration error. Please contact support.';
      } else if (recaptchaResult.errorCodes && recaptchaResult.errorCodes.includes('invalid-input-response')) {
        userMessage = 'reCAPTCHA verification expired. Please complete the verification again.';
      }
      
      return res.status(400).json({
        success: false,
        message: userMessage
      });
    }

    // Check if user exists and get password and registeredWithGoogle flag
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +registeredWithGoogle');

    if (!user) {
      console.log('Login attempt: User not found for email:', email.toLowerCase());
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account was registered with Google OAuth
    if (user.registeredWithGoogle) {
      return res.status(403).json({
        success: false,
        message: 'This account was registered using Google. Please sign in with Google instead.',
        authMethod: 'google'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log('Login attempt: Password mismatch for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        howHeard: user.howHeard,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth login (for existing users)
// @access  Public
router.get('/google', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured'
      });
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    
    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('Google OAuth login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating Google login',
      error: error.message,
    });
  }
});

// @route   GET /api/auth/google/register
// @desc    Initiate Google OAuth registration (for new users)
// @access  Public
router.get('/google/register', async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured'
      });
    }

    // Get fingerprint from query params and pass it through OAuth state parameter
    const fingerprint = req.query.fingerprint || null;
    const state = fingerprint ? encodeURIComponent(JSON.stringify({ fingerprint })) : '';
    
    let googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI_REGISTER)}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    
    if (state) {
      googleAuthUrl += `&state=${state}`;
    }
    
    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('Google OAuth registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating Google registration',
      error: error.message,
    });
  }
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback for login
// @access  Public
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;

    // Check if Google returned an error
    if (oauthError) {
      console.error('Google OAuth error:', oauthError);
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }

    if (!code) {
      console.error('No authorization code received from Google');
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2ClientLogin.getToken(code);
    oauth2ClientLogin.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2ClientLogin.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture, email_verified } = payload;

    if (!email) {
      console.error('No email in Google payload');
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_no_email`);
    }

    if (!email_verified) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_email_not_verified`);
    }

    // Get client IP address
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Get fingerprint from query params if available
    const deviceFingerprint = req.query.fingerprint || null;

    // Find existing user - only allow login if user is already registered
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { googleId: googleId }
      ]
    });

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_not_registered`);
    }

    // Update existing user with Google info if needed (but don't change registeredWithGoogle)
    // This allows users who registered manually to also use Google login later
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      // Don't set registeredWithGoogle here - only set during initial Google registration
    }
    if (picture) {
      user.profilePicture = picture;
    }
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    console.error('Error stack:', error.stack);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

// @route   GET /api/auth/google/callback/register
// @desc    Handle Google OAuth callback for registration
// @access  Public
router.get('/google/callback/register', async (req, res) => {
  try {
    const { code, error: oauthError, state } = req.query;

    // Check if Google returned an error
    if (oauthError) {
      console.error('Google OAuth registration error:', oauthError);
      return res.redirect(`${FRONTEND_URL}/register?error=google_auth_failed`);
    }

    if (!code) {
      console.error('No authorization code received from Google');
      return res.redirect(`${FRONTEND_URL}/register?error=google_auth_failed`);
    }

    // Extract fingerprint from state parameter if available
    let deviceFingerprint = null;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        deviceFingerprint = stateData.fingerprint || null;
      } catch (stateError) {
        console.error('Error parsing state parameter:', stateError);
        // Continue without fingerprint if state parsing fails
      }
    }

    // Exchange code for tokens
    const { tokens } = await oauth2ClientRegister.getToken(code);
    oauth2ClientRegister.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2ClientRegister.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture, email_verified } = payload;

    if (!email) {
      console.error('No email in Google payload');
      return res.redirect(`${FRONTEND_URL}/register?error=google_auth_no_email`);
    }

    if (!email_verified) {
      return res.redirect(`${FRONTEND_URL}/register?error=google_auth_email_not_verified`);
    }

    // Get client IP address
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // deviceFingerprint is already extracted from state parameter above

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { googleId: googleId }
      ]
    });

    if (existingUser) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_already_registered`);
    }

      // Create new user
      const user = new User({
        firstName: firstName || 'User',
        lastName: lastName || '',
        email: normalizedEmail,
        googleId: googleId,
        authProvider: 'google',
        registeredWithGoogle: true,
        profilePicture: picture || '',
        isEmailVerified: true,
        registrationIP: clientIP,
        deviceFingerprint: deviceFingerprint,
        // Optional fields for Google OAuth users
        phone: '',
        address: '',
        howHeard: 'Other'
      });

    await user.save({ validateBeforeSave: false });

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Google OAuth registration callback error:', error);
    console.error('Error stack:', error.stack);
    res.redirect(`${FRONTEND_URL}/register?error=google_auth_failed`);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset code
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Security: Don't reveal if user exists or not, but check for Google registration
    if (user) {
      // Check if user registered with Google - ONLY check the registeredWithGoogle boolean field
      if (user.registeredWithGoogle === true) {
        return res.status(403).json({
          success: false,
          message: 'This account was registered using Google. Please sign in with Google instead.',
          authMethod: 'google'
        });
      }

      // If user exists and is NOT registered with Google, generate reset code and send email
      // Generate password reset code
      const resetCode = user.generatePasswordResetCode();
      await user.save({ validateBeforeSave: false });

      // Send password reset email
      try {
        await sendEmail({
          email: user.email,
          subject: 'Reset Your Password - HelioScribe',
          html: getPasswordResetEmailTemplate(user.firstName, resetCode)
        });
        console.log(`Password reset code sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        console.error('Email error details:', {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response
        });
        // Clear the reset code if email fails
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset email. Please try again later.'
        });
      }
    }

    // Always return success message (security: don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
});

// @route   POST /api/auth/verify-reset-code
// @desc    Verify password reset code and get reset token
// @access  Public
router.post('/verify-reset-code', [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('code')
    .notEmpty().withMessage('Reset code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits')
    .matches(/^\d+$/).withMessage('Reset code must contain only numbers')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, code } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Find user with reset code fields
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordResetCode +passwordResetCodeExpire');

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
        message: 'This account was registered using Google. Please sign in with Google instead.',
        authMethod: 'google'
      });
    }

    // Check if reset code exists
    if (!user.passwordResetCode || !user.passwordResetCodeExpire) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code. Please request a new one.'
      });
    }

    // Check if code is expired
    if (user.passwordResetCodeExpire < Date.now()) {
      // Clear expired code
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    // Verify reset code
    if (user.passwordResetCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Please check and try again.'
      });
    }

    // Code is valid - generate secure reset token
    const resetToken = generateResetToken(user._id, user.email);
    
    // Store token in database (for additional security - can verify token belongs to user)
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    // Clear the code since it's been used
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully',
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during code verification'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using reset token (after code verification)
// @access  Public
router.post('/reset-password', [
  body('resetToken')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { resetToken, newPassword } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Verify and decode the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      
      // Verify token type
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token.'
        });
      }
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Reset token has expired. Please request a new reset code.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token.'
      });
    }

    // Find user with reset token fields
    const user = await User.findById(decoded.id)
      .select('+passwordResetToken +passwordResetTokenExpire +password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify email matches (additional security)
    if (user.email.toLowerCase() !== decoded.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token.'
      });
    }

    // Check if user registered with Google
    if (user.registeredWithGoogle === true) {
      return res.status(403).json({
        success: false,
        message: 'This account was registered using Google. Please sign in with Google instead.',
        authMethod: 'google'
      });
    }

    // Verify token exists in database and matches
    if (!user.passwordResetToken || user.passwordResetToken !== resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new reset code.'
      });
    }

    // Check if token is expired in database
    if (!user.passwordResetTokenExpire || user.passwordResetTokenExpire < Date.now()) {
      // Clear expired token
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new reset code.'
      });
    }

    // Update password and clear reset token (one-time use)
    // Hash password manually using bcrypt with 12 salt rounds (same as registration/login)
    // We use findByIdAndUpdate to bypass pre-save hook and prevent double-hashing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user directly with hashed password, bypassing pre-save hook
    await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetTokenExpire: undefined
      },
      { 
        new: true,
        runValidators: false // Skip validators since we're manually hashing
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

module.exports = router;

