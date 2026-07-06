/** * @fileoverview This file contains controllers for handling OAuth authentication flows, specifically for Google OAuth.
 * It includes functions to initiate the OAuth flow and handle the callback after user authorization.
 */
const pkceService = require('../../services/pkce-service');
const { GoogleOAuthService } = require('../../services/google-oauth-service');
const tokenService = require('../../services/token-service');
const userRepository = require('../../repositories/user-repository');
const refreshTokenRepository = require('../../repositories/refresh-token-repository');
const { ApiResponse } = require('../../utils/responses');
const { BadRequest } = require('../../utils/exceptions/custom-exceptions');
const { setRefreshCookie } = require('./auth-controllers');

const config = require('../../configs/config');
const REFRESH_TOKEN_TTL = Number(config.app.JWT_REFRESH_TOKEN_TTL);

const googleOAuthService = new GoogleOAuthService();

/** * Initiates the Google OAuth flow by generating a code verifier, code challenge, state, and nonce.
 * It stores the state and associated data in the PKCE service and redirects the user to Google's authorization URL.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to redirect the user.
 */
const initiateGoogleOAuthController = async (req, res, next) => {
    
    try {
        const codeVerifier = pkceService.generateCodeVerifier();
        const codeChallenge = pkceService.generateCodeChallenge(codeVerifier);
        const state = pkceService.generateState();
        const nonce = pkceService.generateNonce();
        await pkceService.storeOAuthState(state, { codeVerifier, nonce });
        const redirectUrl = googleOAuthService.buildAuthorizationUrl({ codeChallenge, state, nonce });
        return res.redirect(redirectUrl);
    } catch (error) {
        next(error);
    }
};

/** * Handles the Google OAuth callback by exchanging the authorization code for tokens, verifying the state, and managing user sessions.
 * It also generates access and refresh tokens for the user and sets the refresh token in a secure cookie.
 * @param {Object} req - The request object containing query parameters and OAuth state.
 * @param {Object} res - The response object used to send back the result.
 */
const callbackGoogleOAuthController = async (req, res, next) => {

    try {
        const { query: { code }, oauthState } = req; 
        const { sub: googleSub, email } = await googleOAuthService.handle({
            code,
            codeVerifier: oauthState.codeVerifier,
            nonce: oauthState.nonce,
        });
        const user = await userRepository.findOrCreateGoogleUser({ googleSub, email });
        const { token: accessToken, expiresIn } = tokenService.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        const { token: refreshToken, jti } = tokenService.signRefreshToken({ sub: user.id, });
        await refreshTokenRepository.revokeAllUserSessions(user.id);
        await refreshTokenRepository.storeRefreshToken({ jti, userId: user.id, ttlSeconds: REFRESH_TOKEN_TTL });
        setRefreshCookie(res, refreshToken);
        const apiResponse = new ApiResponse();
        apiResponse.message = 'Google OAuth authentication successful.';
        apiResponse.data = { accessToken, refreshToken, tokenType: 'Bearer' };
        return res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    initiateGoogleOAuthController,
    callbackGoogleOAuthController
};
