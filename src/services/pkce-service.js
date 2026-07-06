const crypto = require('crypto');
const redis = require('../configs/redis');
const OAUTH_STATE_TTL = 600;

/**
 * Generates a code verifier for PKCE.
 * @returns {string} A base64url-encoded code verifier.
 */
const generateCodeVerifier = () => crypto.randomBytes(32).toString('base64url');

/**
 * Generates a code challenge from a given code verifier.
 * @param {string} codeVerifier - The code verifier.
 * @returns {string} A base64url-encoded SHA256 hash of the code verifier.
 */
const generateCodeChallenge = (codeVerifier) => crypto.createHash('sha256').update(codeVerifier).digest('base64url');

/**
 * Stores the OAuth state in Redis with a time-to-live (TTL).
 * @param {string} state - The OAuth state.
 * @param {{codeVerifier: string, nonce: string}} data - The code verifier and nonce to store.
 * @returns {Promise<void>}
 */
const storeOAuthState = async (state, { codeVerifier, nonce }) => {
    console.log(`Storing OAuth state in Redis: ${state} with codeVerifier: ${codeVerifier} and nonce: ${nonce}`);
    await redis.set(
        `oauth:state:${state}`,
        JSON.stringify({ codeVerifier, nonce }),
        'EX',
        OAUTH_STATE_TTL
    );
};

/**
 * Retrieves the stored OAuth state from Redis.
 * @param {string} state - The OAuth state.
 * @returns {Promise<{codeVerifier: string, nonce: string} | null>} The stored code verifier and nonce, or null if not found.
 */
const getOAuthState = async (state) => {
    const data = await redis.get(`oauth:state:${state}`);
    if (!data) return null;
    return JSON.parse(data);
};

/**
 * Deletes the stored OAuth state from Redis.
 * @param {string} state - The OAuth state.
 * @returns {Promise<void>}
 */
const deleteOAuthState = async (state) => await redis.del(`oauth:state:${state}`);

/**
 * Generates a random state parameter for OAuth.
 * @returns {string} A random state string.
 */
const generateState = () => crypto.randomBytes(16).toString('hex');

/**
 * Generates a random nonce parameter for OAuth.
 * @returns {string} A random nonce string.
 */
const generateNonce = () => crypto.randomBytes(16).toString('hex');

module.exports = {
    generateCodeVerifier,
    generateCodeChallenge,
    storeOAuthState,
    getOAuthState,
    deleteOAuthState,
    generateState,
    generateNonce,
};
