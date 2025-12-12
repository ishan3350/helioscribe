const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Website = require('../models/Website');
const { protect } = require('../middleware/auth');

// Helper function to generate unique 10-character alphanumeric ID
const generateWebsiteId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to ensure unique website ID
const ensureUniqueWebsiteId = async () => {
  let websiteId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    websiteId = generateWebsiteId();
    const existing = await Website.findOne({ websiteId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique website ID. Please try again.');
  }

  return websiteId;
};

// @route   POST /api/websites
// @desc    Add a new website
// @access  Private
router.post('/', [
  protect,
  body('domain')
    .trim()
    .notEmpty().withMessage('Please enter your website domain name to continue.')
    .isLength({ min: 3, max: 253 }).withMessage('Domain name must be between 3 and 253 characters in length.')
    .matches(/^([a-z0-9]([a-z0-9\-]*[a-z0-9])?\.)+[a-z]{2,}$/i).withMessage('The domain format is invalid. Please enter a valid domain like example.com or subdomain.example.com (without http:// or https://).'),
  body('description')
    .trim()
    .notEmpty().withMessage('Please provide a description of your website to help us understand its purpose.')
    .isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters. Please provide a detailed description of your website.'),
  body('employeesCount')
    .notEmpty().withMessage('Please select the number of employees in your organization from the dropdown menu.')
    .isIn([
      '1-10',
      '11-50',
      '51-100',
      '101-250',
      '251-500',
      '501-1000',
      '1001-5000',
      '5001-10000',
      '10000+'
    ]).withMessage('Please select a valid employee count range from the dropdown menu.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { domain, description, employeesCount } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    // Normalize domain (lowercase, trim)
    const normalizedDomain = domain.toLowerCase().trim();

    // Check if domain already exists
    const existingWebsite = await Website.findOne({ domain: normalizedDomain });
    if (existingWebsite) {
      return res.status(409).json({
        success: false,
        message: `The domain "${normalizedDomain}" has already been added to our system. Each domain can only be added once. If this is your website, please contact support for assistance.`
      });
    }

    // Generate unique website ID
    const websiteId = await ensureUniqueWebsiteId();

    // Create new website
    const website = new Website({
      domain: normalizedDomain,
      description: description.trim(),
      employeesCount,
      websiteId,
      website_owner: userEmail,
      createdAt: new Date() // UTC date
    });

    await website.save();

    // Create Qdrant collection for this website
    try {
      const qdrantUrl = `http://91.99.202.14:6333/collections/${websiteId}`;
      await axios.put(qdrantUrl, {
        vectors: {
          size: 2560,
          distance: "Cosine",
          on_disk: true
        },
        on_disk_payload: true,
        hnsw_config: {
          m: 16,
          ef_construct: 100,
          on_disk: true
        },
        quantization_config: {
          scalar: {
            type: "int8",
            quantile: 0.99,
            always_ram: false
          }
        }
      }, {
        headers: {
          "Content-Type": "application/json",
          "api-key": "6QL1XGQ3OP2CEW7DA9E6KLWDM74TFC0NJD0W43DO6YGNG5EBVE"
        }
      });
    } catch (qdrantError) {
      // If Qdrant API call failed, delete the website from MongoDB
      await Website.findByIdAndDelete(website._id);
      
      console.error('Qdrant collection creation failed:', qdrantError.response?.data || qdrantError.message);
      
      return res.status(500).json({
        success: false,
        message: 'We encountered an issue while setting up your website. Please try again in a few moments. If the problem persists, contact support.'
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${website.domain}. Your website has been added to your account and is ready to use.`,
      data: {
        website: {
          id: website._id,
          domain: website.domain,
          description: website.description,
          employeesCount: website.employeesCount,
          websiteId: website.websiteId,
          website_owner: website.website_owner,
          createdAt: website.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Add website error:', error);
    
    // Handle duplicate key errors (in case race condition occurs)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'domain') {
        const domainName = req.body.domain?.toLowerCase().trim() || 'this domain';
        return res.status(409).json({
          success: false,
          message: `The domain "${domainName}" has already been added to our system. Each domain can only be added once. If this is your website, please contact support for assistance.`
        });
      } else if (field === 'websiteId') {
        return res.status(500).json({
          success: false,
          message: 'We encountered an issue while generating a unique identifier for your website. Please try again in a moment.'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'We\'re unable to process your request right now. Our system is experiencing temporary difficulties. Please try again in a few moments, or contact support if the issue persists.'
    });
  }
});

// @route   GET /api/websites
// @desc    Get all websites for the current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const websites = await Website.find({ website_owner: userEmail })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        websites
      }
    });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve websites at this time. Please try again.'
    });
  }
});

module.exports = router;

