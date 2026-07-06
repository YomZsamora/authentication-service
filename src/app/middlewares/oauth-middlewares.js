const { handleBadRequests } = require('../../utils/exceptions/exception-handler');
const { callbackGoogleOAuthValidators, verifyOAuthStateValidator } = require('../../utils/validators/oauth-validators');

/** * Middleware for initiating the Google OAuth flow.
 * Currently, this middleware does not perform any specific validation or processing,
 * but it is structured to allow for future enhancements if needed.
 */
const initiateGoogleOAuthMiddleware = [];

/** * Middleware for handling the Google OAuth callback.
 * It includes validators for the required query parameters and verifies the OAuth state.
 */
const callbackGoogleOAuthMiddleware = [
    ...callbackGoogleOAuthValidators,
    handleBadRequests('Error occurred during Google OAuth callback.'),
    verifyOAuthStateValidator,
];

module.exports = { 
    initiateGoogleOAuthMiddleware, 
    callbackGoogleOAuthMiddleware 
};
