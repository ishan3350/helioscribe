const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: function() {
      return this.authProvider !== 'google';
    },
    trim: true
  },
  address: {
    type: String,
    required: function() {
      return this.authProvider !== 'google';
    },
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  howHeard: {
    type: String,
    required: function() {
      return this.authProvider !== 'google';
    },
    trim: true,
    enum: ['Reddit', 'Search Engine', 'Friend', 'AI Chat Bot', 'Social Media', 'Ad', 'Other'],
    maxlength: [100, 'Response cannot exceed 100 characters']
  },
  registrationIP: {
    type: String,
    trim: true
  },
  deviceFingerprint: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider !== 'google';
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  registeredWithGoogle: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: function() {
      // Google OAuth users have verified emails by default
      return this.authProvider === 'google';
    }
  },
  emailVerificationCode: {
    type: String,
    select: false
  },
  emailVerificationCodeExpire: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  // Skip password hashing for Google OAuth users
  if (this.authProvider === 'google' || !this.password) {
    return next();
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate verification code
userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationCode = code;
  const expireMinutes = parseInt(process.env.VERIFICATION_CODE_EXPIRE) || 15;
  this.emailVerificationCodeExpire = Date.now() + expireMinutes * 60 * 1000;
  return code;
};

module.exports = mongoose.model('User', userSchema);

