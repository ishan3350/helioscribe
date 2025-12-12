const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Basic domain validation - should not include http:// or https://
        // Allows domains like example.com, subdomain.example.com, etc.
        const domainRegex = /^([a-z0-9]([a-z0-9\-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
        return domainRegex.test(v);
      },
      message: 'Please enter a valid domain name (e.g., example.com)'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  employeesCount: {
    type: String,
    required: [true, 'Employee count is required'],
    enum: [
      '1-10',
      '11-50',
      '51-100',
      '101-250',
      '251-500',
      '501-1000',
      '1001-5000',
      '5001-10000',
      '10000+'
    ]
  },
  websiteId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  website_owner: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We'll use createdAt manually
});

// Ensure websiteId is unique
websiteSchema.index({ websiteId: 1 }, { unique: true });
websiteSchema.index({ domain: 1 }, { unique: true });

module.exports = mongoose.model('Website', websiteSchema);

