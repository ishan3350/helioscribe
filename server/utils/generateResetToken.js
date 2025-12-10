const jwt = require('jsonwebtoken');

/**
 * Generate a secure password reset token
 * This token is used after code verification to allow password reset
 * @param {String} userId - User ID
 * @param {String} email - User email for additional security
 * @returns {String} JWT token
 */
const generateResetToken = (userId, email) => {
  return jwt.sign(
    { 
      id: userId, 
      email: email.toLowerCase(),
      type: 'password_reset' 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: '10m' // Token expires in 10 minutes
    }
  );
};

module.exports = generateResetToken;

