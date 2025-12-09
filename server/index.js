const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration - Must be before other middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security Middleware - Configure Helmet to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize());
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiting for development, stricter for production
// Rate limiting for authentication endpoints
// More lenient in development to allow testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 in production, 50 in development
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in a few minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV !== 'production') {
      const ip = req.ip || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress;
      const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
      return localhostIPs.includes(ip);
    }
    return false;
  }
});

// Apply rate limiting (auth routes have stricter limits)
// Apply rate limiting to auth routes (stricter limits)
app.use('/api/auth', authLimiter);
// General API rate limiting (applied to all other API routes)
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check reCAPTCHA configuration
  if (process.env.RECAPTCHA_SECRET_KEY) {
    console.log('✓ reCAPTCHA secret key is configured');
  } else {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY is not set in environment variables');
  }

  // Check Google OAuth configuration
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log('✓ Google OAuth Client ID is configured');
  } else {
    console.warn('⚠️  GOOGLE_CLIENT_ID is not set in environment variables');
    console.warn('   Google sign-in will not work until GOOGLE_CLIENT_ID is configured');
  }
});

