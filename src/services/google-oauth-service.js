const axios = require('axios');
const config = require('../configs/config');
const { OAuth2Client } = require('google-auth-library');
const { BadRequest } = require('../utils/exceptions/custom-exceptions');

/** 
 * Service class for handling Google OAuth authentication.
 * This service provides methods to initiate the OAuth flow, exchange authorization codes for tokens,
 * and verify ID tokens received from Google.
 */
class GoogleOAuthService {

    constructor() {
        this.tokenUrl = config.google.GOOGLE_TOKEN_URL;
        this.client = new OAuth2Client(config.google.GOOGLE_CLIENT_ID);
    }

    /**
     * Handles the Google OAuth process by exchanging the authorization code for tokens and verifying the ID token.
     * @param {Object} params - The parameters for handling the OAuth process.
     * @param {string} params.code - The authorization code received from Google.
     * @param {string} params.codeVerifier - The code verifier used in the PKCE flow.
     * @param {string} params.nonce - The nonce used to verify the ID token.
     * @returns {Promise<Object>} - An object containing user information extracted from the ID token.
     */
    async handle({ code, codeVerifier, nonce }) {
        const tokens = await this._exchangeCode(code, codeVerifier);
        const userInfo = await this._verifyIdToken(tokens.id_token, nonce);
        return userInfo;
    }

    /**
     * Exchanges the authorization code for access and ID tokens from Google's token endpoint.
     * @param {string} code - The authorization code received from Google.
     * @param {string} codeVerifier - The code verifier used in the PKCE flow.
     * @returns {Promise<Object>} - An object containing the access token, ID token, and other token information.
     */
    async _exchangeCode(code, codeVerifier) {

        try {
            const response = await axios.post(this.tokenUrl, {
                code,
                client_id: config.google.GOOGLE_CLIENT_ID,
                client_secret: config.google.GOOGLE_CLIENT_SECRET,
                redirect_uri: config.google.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
                code_verifier: codeVerifier,
            });
            return response.data;
        } catch (error) {
            throw new BadRequest('Failed to exchange authorization code with Google.');
        }
    }

    /**
     * Verifies the ID token received from Google and extracts user information.
     * @param {string} idToken - The ID token received from Google.
     * @param {string} nonce - The nonce used to verify the ID token.
     * @returns {Promise<Object>} - An object containing user information such as sub, email, and name.
     */
    async _verifyIdToken(idToken, nonce) {

        let payload;
        try {
            const ticket = await this.client.verifyIdToken({ idToken, audience: config.google.GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        } catch (error) {
            throw new BadRequest('Failed to verify Google ID token.');
        }
        if (payload.nonce !== nonce) throw new BadRequest('ID token nonce mismatch.');
        return {
            sub: payload.sub,
            email: payload.email,
            name: payload.name ?? null,
        };
    }

    /**
     * Builds the Google OAuth authorization URL with the necessary query parameters.
     * @param {Object} params - The parameters for building the authorization URL.
     * @param {string} params.codeChallenge - The code challenge used in the PKCE flow.
     * @param {string} params.state - The state parameter to prevent CSRF attacks.
     * @param {string} params.nonce - The nonce used to verify the ID token.
     * @returns {string} - The constructed Google OAuth authorization URL.
     */
    buildAuthorizationUrl({ codeChallenge, state, nonce }) {
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', config.google.GOOGLE_CLIENT_ID);
        url.searchParams.set('redirect_uri', config.google.GOOGLE_CALLBACK_URL);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid email profile');
        url.searchParams.set('code_challenge', codeChallenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('state', state);
        url.searchParams.set('nonce', nonce);
        return url.toString();
    }
}

module.exports = { GoogleOAuthService };
