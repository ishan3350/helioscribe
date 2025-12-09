const axios = require('axios');
const verifyRecaptchaEnterprise = require('./verifyRecaptchaEnterprise');

/**
 * Verify reCAPTCHA token with Google's API
 * Supports both standard reCAPTCHA v2/v3 and Enterprise
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} remoteip - Optional: The user's IP address
 * @param {string} action - Optional: Action name for Enterprise (e.g., 'register', 'login')
 * @returns {Promise<Object>} - Verification result
 */
const verifyRecaptcha = async (token, remoteip = null, action = null) => {
  // Check if Enterprise mode is enabled
  const useEnterprise = process.env.RECAPTCHA_ENTERPRISE === 'true' || process.env.RECAPTCHA_ENTERPRISE === '1';
  
  if (useEnterprise && action) {
    // Try Enterprise first
    const enterpriseResult = await verifyRecaptchaEnterprise(token, action, remoteip);
    if (!enterpriseResult.fallback) {
      return enterpriseResult;
    }
    // If Enterprise fails due to credentials, fall back to standard API
    console.warn('Falling back to standard reCAPTCHA API');
  }
  
  // Standard reCAPTCHA API verification
  try {
    if (!token) {
      return {
        success: false,
        error: 'reCAPTCHA token is missing'
      };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not set in environment variables');
      return {
        success: false,
        error: 'reCAPTCHA configuration error'
      };
    }

    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    
    const params = new URLSearchParams({
      secret: secretKey,
      response: token
    });

    if (remoteip) {
      params.append('remoteip', remoteip);
    }

    const response = await axios.post(verificationURL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000 // 5 second timeout
    });

    const { success, score, action: responseAction, challenge_ts, hostname, 'error-codes': errorCodes } = response.data;

    if (!success) {
      console.error('reCAPTCHA verification failed:', {
        errorCodes: errorCodes || [],
        hostname,
        remoteip
      });
      
      // Provide more specific error messages
      let errorMessage = 'reCAPTCHA verification failed';
      if (errorCodes && errorCodes.length > 0) {
        const errorCode = errorCodes[0];
        switch (errorCode) {
          case 'missing-input-secret':
            errorMessage = 'reCAPTCHA secret key is missing';
            break;
          case 'invalid-input-secret':
            errorMessage = 'reCAPTCHA secret key is invalid';
            break;
          case 'missing-input-response':
            errorMessage = 'reCAPTCHA token is missing';
            break;
          case 'invalid-input-response':
            errorMessage = 'reCAPTCHA token is invalid or expired';
            break;
          case 'bad-request':
            errorMessage = 'Invalid reCAPTCHA request';
            break;
          case 'timeout-or-duplicate':
            errorMessage = 'reCAPTCHA token has expired or already been used';
            break;
          default:
            errorMessage = `reCAPTCHA error: ${errorCode}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCodes: errorCodes || []
      };
    }

    // For reCAPTCHA v3, check the score (typically > 0.5 is human)
    // For v2, success is enough (score will be null)
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD) || 0.5;
    
    if (score !== null && score !== undefined) {
      // This is v3, check the score
      if (score < scoreThreshold) {
        console.warn(`Low reCAPTCHA v3 score: ${score} (threshold: ${scoreThreshold})`);
        return {
          success: false,
          error: 'reCAPTCHA score too low',
          score: score,
          threshold: scoreThreshold,
          errorCodes: ['low-score']
        };
      }
    }
    
    return {
      success: true,
      score: score || null,
      action: responseAction || null,
      challenge_ts,
      hostname
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA',
      details: error.message
    };
  }
};

module.exports = verifyRecaptcha;

