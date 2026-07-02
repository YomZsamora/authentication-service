/**
 * Token Service
 * This service handles the signing and verification of JWT access and refresh tokens.
 */
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const config = require('../configs/config');
const { loadPrivateKey, loadPublicKey } = require('../utils/keys');
const { TokenExpired, InvalidJsonWebToken } = require('../utils/exceptions/custom-exceptions');

const ACCESS_TOKEN_TTL = Number(config.app.JWT_ACCESS_TOKEN_TTL);
const REFRESH_TOKEN_TTL = Number(config.app.JWT_REFRESH_TOKEN_TTL);

/** * Signs a new access token with the provided payload.
 * @param {Object} payload - The payload to include in the token.
 * @returns {Object} - An object containing the signed token, its unique identifier (jti), and its expiration time.
 */
const signAccessToken = ({ sub, email, role }) => {
    const jti = `jti_${randomUUID()}`;
    const token = jwt.sign({ 
            jti,
            sub, 
            email, 
            role,  
        },
        loadPrivateKey(),
        {
            algorithm: 'RS256',
            expiresIn: ACCESS_TOKEN_TTL,
            keyid: config.app.JWT_KEY_ID,
            issuer: config.app.JWT_ISSUER,
            audience: config.app.JWT_AUDIENCE,
        }
    );
    return { token, jti, expiresIn: ACCESS_TOKEN_TTL };
};

/** * Signs a new refresh token with the provided payload.
 * @param {Object} payload - The payload to include in the token.
 * @returns {Object} - An object containing the signed token, its unique identifier (jti), and its expiration time.
 */
const signRefreshToken = ({ sub }) => {
    const jti = `jti_${randomUUID()}`;
    const token = jwt.sign({ 
            sub, 
            jti 
        },
        loadPrivateKey(),
        {
            algorithm: 'RS256',
            expiresIn: REFRESH_TOKEN_TTL,
            keyid: config.app.JWT_KEY_ID,
        }
    );
    return { token, jti, expiresIn: REFRESH_TOKEN_TTL };
};

/** * Normalizes JWT verification errors and throws custom exceptions.
 * @param {Error} err - The error thrown during JWT verification.
 * @throws {TokenExpired|InvalidJsonWebToken|Error} - Throws a custom exception based on the error type.
 */
const normalizeVerifyError = (err) => {
    if (err.name === 'TokenExpiredError') throw new TokenExpired();
    else if (err.name === 'JsonWebTokenError') throw new InvalidJsonWebToken();
    throw err;
};

/** * Verifies the provided access token and returns its decoded payload.
 * @param {string} token - The access token to verify.
 * @returns {Object} - The decoded payload of the verified token.
 * @throws {TokenExpired|InvalidJsonWebToken|Error} - Throws a custom exception if verification fails.
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, loadPublicKey(), {
            algorithms: ['RS256'],
            issuer: config.app.JWT_ISSUER,
            audience: config.app.JWT_AUDIENCE,
        });
    } catch (err) {
        normalizeVerifyError(err);
    }
};

/** * Verifies the provided refresh token and returns its decoded payload.
 * @param {string} token - The refresh token to verify.
 * @returns {Object} - The decoded payload of the verified token.
 * @throws {TokenExpired|InvalidJsonWebToken|Error} - Throws a custom exception if verification fails.
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, loadPublicKey(), { algorithms: ['RS256'] });
    } catch (err) {
        normalizeVerifyError(err);
    }
};

module.exports = { 
    signAccessToken, 
    signRefreshToken, 
    verifyAccessToken, 
    verifyRefreshToken 
};
