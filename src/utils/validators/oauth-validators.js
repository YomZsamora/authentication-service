const { query } = require('express-validator');
const { BadRequest } = require('../exceptions/custom-exceptions');
const pkceService = require('../../services/pkce-service');

/** * Validators for handling Google OAuth callback requests.
 * These validators ensure that the required query parameters are present and valid.
 */
const callbackGoogleOAuthValidators = [
    query('state').notEmpty().withMessage('state is required.'),
    query('code').notEmpty().withMessage('code is required.'),
];

/** * Middleware to verify the OAuth state parameter during the Google OAuth callback.
 * It checks if the state exists in the PKCE service, retrieves the associated data, and attaches it to the request object.
 * If the state is invalid or expired, it throws a BadRequest error.
 */
const verifyOAuthStateValidator = query('state')
    .custom(async (state, { req }) => {
        const oauthState = await pkceService.getOAuthState(state);
        if (!oauthState) throw new BadRequest('Invalid or expired OAuth state.');
        await pkceService.deleteOAuthState(state);
        req.oauthState = oauthState;
        return true;
    });

module.exports = { 
    callbackGoogleOAuthValidators, 
    verifyOAuthStateValidator 
};
