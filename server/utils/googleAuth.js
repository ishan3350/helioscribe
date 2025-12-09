const { OAuth2Client } = require('google-auth-library');

/**
 * Verify Google ID token
 * @param {string} token - Google ID token from client
 * @returns {Promise<Object>} - User information from Google
 */
const verifyGoogleToken = async (token) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID is not set in environment variables');
      throw new Error('Google authentication is not properly configured. Please contact support.');
    }

    const client = new OAuth2Client(clientId);
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    
    return {
      success: true,
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      firstName: payload.given_name,
      lastName: payload.family_name,
      profilePicture: payload.picture,
      name: payload.name,
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify Google token'
    };
  }
};

module.exports = { verifyGoogleToken };

