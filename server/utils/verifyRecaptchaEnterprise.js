const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

/**
 * Verify reCAPTCHA Enterprise token
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} action - The action name (e.g., 'register', 'login')
 * @param {string} remoteip - Optional: The user's IP address
 * @returns {Promise<Object>} - Verification result
 */
const verifyRecaptchaEnterprise = async (token, action, remoteip = null) => {
  try {
    if (!token) {
      return {
        success: false,
        error: 'reCAPTCHA token is missing'
      };
    }

    const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'helioscribe';
    const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LfwaSUsAAAAAH3I78UoLtWiUJ37LATeRo00B-J-';
    
    // Check if Google Cloud credentials are configured
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_PROJECT) {
      console.warn('Google Cloud credentials not found. Falling back to standard reCAPTCHA API.');
      return {
        success: false,
        error: 'Google Cloud credentials not configured for Enterprise reCAPTCHA',
        fallback: true
      };
    }

    // Create the reCAPTCHA Enterprise client
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    // Build the assessment request
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaSiteKey,
        },
      },
      parent: projectPath,
    };

    // Add IP address if provided
    if (remoteip) {
      request.assessment.event.userIpAddress = remoteip;
    }

    const [response] = await client.createAssessment(request);

    // Check if the token is valid
    if (!response.tokenProperties.valid) {
      console.error(`reCAPTCHA Enterprise token invalid: ${response.tokenProperties.invalidReason}`);
      return {
        success: false,
        error: `reCAPTCHA token invalid: ${response.tokenProperties.invalidReason}`,
        invalidReason: response.tokenProperties.invalidReason
      };
    }

    // Check if the expected action was executed
    if (response.tokenProperties.action !== action) {
      console.warn(`Action mismatch. Expected: ${action}, Got: ${response.tokenProperties.action}`);
      return {
        success: false,
        error: 'reCAPTCHA action mismatch',
        expectedAction: action,
        receivedAction: response.tokenProperties.action
      };
    }

    // Get the risk score
    const score = response.riskAnalysis.score;
    const reasons = response.riskAnalysis.reasons || [];

    // Typically, scores above 0.5 are considered legitimate users
    // You can adjust this threshold based on your security requirements
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD) || 0.5;

    if (score < scoreThreshold) {
      console.warn(`Low reCAPTCHA score: ${score}. Reasons:`, reasons);
      return {
        success: false,
        error: 'reCAPTCHA score too low',
        score: score,
        threshold: scoreThreshold,
        reasons: reasons
      };
    }

    return {
      success: true,
      score: score,
      action: response.tokenProperties.action,
      hostname: response.tokenProperties.hostname,
      reasons: reasons
    };
  } catch (error) {
    console.error('reCAPTCHA Enterprise verification error:', error.message);
    
    // If it's a credentials error, suggest fallback
    if (error.message.includes('credentials') || error.message.includes('authentication')) {
      return {
        success: false,
        error: 'Google Cloud authentication failed',
        details: error.message,
        fallback: true
      };
    }

    return {
      success: false,
      error: 'Failed to verify reCAPTCHA Enterprise',
      details: error.message
    };
  }
};

module.exports = verifyRecaptchaEnterprise;


