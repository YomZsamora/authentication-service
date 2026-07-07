/** * @fileoverview This file contains controllers for handling user authentication, including registration, login, token refresh, and logout.
 * It provides functions to manage user sessions and handle refresh tokens securely.
 */
const { ApiResponse } = require('../../utils/responses');
const userRepository = require('../../repositories/user-repository');
const refreshTokenRepository = require('../../repositories/refresh-token-repository');
const userSerializer = require('../../utils/serializers/user-serializer');
const tokenService = require('../../services/token-service');

const config = require('../../configs/config');
const REFRESH_TOKEN_TTL = Number(config.app.JWT_REFRESH_TOKEN_TTL);

/** * Sets a refresh token cookie in the response.
 * @param {Object} res - The response object used to set the cookie.
 * @param {string} token - The refresh token to be set in the cookie.
 */
const setRefreshCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/v1/auth/refresh-token',
        maxAge: REFRESH_TOKEN_TTL * 1000,
    });
};

/** * Clears the refresh token cookie from the response.
 * @param {Object} res - The response object used to clear the cookie.
 */
const clearRefreshCookie = (res) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/v1/auth/refresh-token',
    });
};

/**
 * Handles the basic registration of a new user.
 * @param {Object} req - The request object containing user registration data.
 * @param {Object} res - The response object used to send back the result.
 */
const basicRegistrationController = async (req, res, next) => {

    try {
        const { email, password, role } = req.body;
        const user = await userRepository.registerUser({ email, password, role });
        const apiResponse = new ApiResponse();
        apiResponse.message = "New user account created successfully.";
        apiResponse.data = userSerializer.serializeUser(user);
        res.status(201).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

/** * Handles the basic login of an existing user.
 * @param {Object} req - The request object containing user login data.
 * @param {Object} res - The response object used to send back the result.
 */
const basicLoginController = async (req, res, next) => {

    try {
        const user = req.user;
        const { token: accessToken, expiresIn } = tokenService.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        const { token: refreshToken, jti } = tokenService.signRefreshToken({ sub: user.id });
        await refreshTokenRepository.revokeAllUserSessions(user.id); 
        await refreshTokenRepository.storeRefreshToken({ jti, userId: user.id, ttlSeconds: REFRESH_TOKEN_TTL });
        setRefreshCookie(res, refreshToken);
        const apiResponse = new ApiResponse();
        apiResponse.message = "Logged in successfully.";
        apiResponse.data = { accessToken, tokenType: 'Bearer', expiresIn };
        res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

/** * Handles the refresh of access tokens using a valid refresh token.
 * @param {Object} req - The request object containing the refresh token.
 * @param {Object} res - The response object used to send back the new access token.
 */
const refreshTokenController = async (req, res, next) => {
    
    try {
        const payload = req.payload;
        const { sub, jti } = payload;
        await refreshTokenRepository.deleteByJti(jti);
        const { token: accessToken, expiresIn } = tokenService.signAccessToken({
            sub,
            email: payload.email,
            role: payload.role,
        });
        const { token: refreshToken, jti: newJti } = tokenService.signRefreshToken({ sub });
        await refreshTokenRepository.storeRefreshToken({ jti: newJti, userId: sub, ttlSeconds: REFRESH_TOKEN_TTL });
        setRefreshCookie(res, refreshToken);
        const apiResponse = new ApiResponse();
        apiResponse.message = "Token refreshed successfully.";
        apiResponse.data = { accessToken, tokenType: 'Bearer', expiresIn };
        res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

/** * Handles the logout of a user by revoking their refresh token and denying their access token.
 * @param {Object} req - The request object containing the refresh token and access token.
 * @param {Object} res - The response object used to send back the logout confirmation.
 */
const logoutController = async (req, res, next) => {

    try {
        const refreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
            try {
                const payload = tokenService.verifyRefreshToken(refreshToken);
                await refreshTokenRepository.deleteByJti(payload.jti);
            } catch (_) {}
        }
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const accessToken = authHeader.split(' ')[1];
            try {
                const payload = tokenService.verifyAccessToken(accessToken);
                const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
                if (remainingTtl > 0) {
                    await tokenService.denylistToken({ jti: payload.jti, ttlSeconds: remainingTtl });
                }
            } catch (_) {}
        }
        clearRefreshCookie(res);
        const apiResponse = new ApiResponse();
        apiResponse.message = "Logged out successfully.";
        res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    basicRegistrationController, 
    basicLoginController,
    refreshTokenController,
    setRefreshCookie,
    clearRefreshCookie,
    logoutController
};
