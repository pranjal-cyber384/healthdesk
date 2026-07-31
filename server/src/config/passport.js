/**
 * Google OAuth Configuration
 * 
 * Uses google-auth-library to verify Google ID tokens
 * sent from the frontend Google Sign-In button.
 */

const { OAuth2Client } = require('google-auth-library');

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
};

/**
 * Create Google OAuth2 client for token verification
 */
const googleClient = new OAuth2Client(googleConfig.clientId);

/**
 * Verify a Google ID token and return the user payload.
 * 
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} User payload from Google
 */
async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleConfig.clientId
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    profileImage: payload.picture || '',
    isEmailVerified: payload.email_verified || false
  };
}

module.exports = {
  googleConfig,
  googleClient,
  verifyGoogleToken
};
