/** * Authentication Controller
 * This module handles user registration and login functionalities.
 */
const { registerUser, findUserByEmail } = require('../../repositories/user-repository');
const { ApiResponse } = require('../../utils/responses');
const { signAccessToken, signRefreshToken } = require('../../services/token-service');
const { storeRefreshToken } = require('../../services/token-store-service');

const config = require('../../configs/config');
const REFRESH_TOKEN_TTL = Number(config.app.JWT_REFRESH_TOKEN_TTL);

const setRefreshCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/v1/auth/refresh',
        maxAge: REFRESH_TOKEN_TTL * 1000,
    });
};

/**
 * Handles the basic registration of a new user.
 * @param {Object} req - The request object containing user registration data.
 * @param {Object} res - The response object used to send back the result.
 */
const basicRegistrationController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await registerUser({ email, password });
        const apiResponse = new ApiResponse();
        apiResponse.message = "New user account created successfully.";
        apiResponse.data = user;
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
        const { token: accessToken, expiresIn } = signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        const { token: refreshToken, jti } = signRefreshToken({ sub: user.id });
        await storeRefreshToken({ jti, userId: user.id, ttlSeconds: REFRESH_TOKEN_TTL });
        setRefreshCookie(res, refreshToken);
        const apiResponse = new ApiResponse();
        apiResponse.message = "Logged in successfully.";
        apiResponse.data = { accessToken, tokenType: 'Bearer', expiresIn };
        res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    basicRegistrationController, 
    basicLoginController 
};