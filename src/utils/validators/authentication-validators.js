const { body } = require('express-validator');
const { BadRequest, NotFound, NotAuthenticated, TokenReuseDetected } = require('../exceptions/custom-exceptions');
const userRepository = require('../../repositories/user-repository');
const refreshTokenRepository = require('../../repositories//refresh-token-repository');
const { verifyRefreshToken } = require('../../services/token-service');
const { clearRefreshCookie } = require('../../app/controllers/authentication-controller');
const { roles } = require('../../models/user');

/**
 * Validates the email field to ensure it is a valid email address and not from suspicious domains.
 * @param {string} email - The email address to validate.
 * @returns {Promise<void>} - Resolves if the email is valid, otherwise throws an error.
 */
const emailFieldValidator = body('email')
    .isEmail({
        allow_display_name: false,
        allow_utf8_local_part: true,
        require_tld: true,
        allow_ip_domain: false,
        domain_specific_validation: true
    }).withMessage('Valid email address is required.')
    .custom((email) => {
        const suspiciousTLDs = ['coom', 'con', 'cm', 'cmo', 'comm', 'om', 'ocm'];
        const domain = email.split('@')[1];
        const tld = domain.split('.').pop().toLowerCase();
        if (suspiciousTLDs.includes(tld)) throw new BadRequest(`Valid email address is required.`);
        
        // Check for repeated domain segments (like example.example.com)
        const domainParts = domain.split('.');
        if (domainParts.length > 2) {
            const [subdomain, mainDomain] = domainParts;
            if (subdomain === mainDomain) throw new BadRequest('Valid email address is required.');
        }
        
        return true;
    });

/**
 * Validates that the provided email is not already registered in the system.
 * @param {string} email - The email address to check for registration.
 * @returns {Promise<void>} - Resolves if the email is not registered, otherwise throws an error.
 */
const emailRegisteredValidator = body('email')
    .custom(async (value, { req }) => {
        const user = await userRepository.findUserByEmail(value);
        if (user) return Promise.reject(`${value} is already in use. Please choose a different email.`);
    });

/**
 * Role Field Validator
 * Validates user role against predefined list of allowed roles
 */
const roleFieldValidator = body('role')
    .exists().withMessage('Role is required.')
    .not().isEmpty().withMessage('Role cannot be empty.')
    .isIn(roles).withMessage(`Please select a valid role from: ${roles.join(', ')}.`);

/** * Validates the password field to ensure it meets security requirements.
 * @param {string} password - The password to validate.
 * @returns {Promise<void>} - Resolves if the password is valid, otherwise throws an error.
 */
const registrationPasswordFieldValidator = body('password')
    .not().isEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
    .isLength({ max: 25 }).withMessage('Password cannot exceed 25 characters.')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{6,}$/)
    .withMessage('Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.');

/** * Validates that the password confirmation matches the password field.
 * @param {string} passwordConfirm - The password confirmation to validate.
 * @returns {Promise<void>} - Resolves if the password confirmation matches, otherwise throws an error.
 */
const passwordConfirmationFieldValidator = body('passwordConfirm')
    .not().isEmpty().withMessage('Password confirmation is required.')
    .custom((value, { req }) => {
        if (value !== req.body.password) throw new BadRequest('Passwords do not match.');
        return true;
    });

/** * Validates the password field during login to ensure it is not empty.
 * @param {string} password - The password to validate.
 * @returns {Promise<void>} - Resolves if the password is provided, otherwise throws an error.
 */
const loginPasswordFieldValidator = body('password')
    .not().isEmpty().withMessage('Password is required.');

/** * Validates that the provided email exists in the system during login.
 * @param {string} email - The email address to check for existence.
 * @returns {Promise<void>} - Resolves if the email exists, otherwise throws an error.
 */
const emailExistsValidator = (req, res, next) => {
    return body('email')
        .custom(async (value, { req }) => {
            const user = await userRepository.findUserByEmail(value);
            if (!user) return next(new NotFound('User account not found. Please check your email and try again.'));
            req.user = user;
            return true;
        })(req, res, next);
    }

/** * Validates that the provided password matches the stored password for the user during login.
 * @param {string} password - The password to validate.
 * @returns {Promise<void>} - Resolves if the password is valid, otherwise throws an error.
 */
const verifyPasswordValidator = (req, res, next) => {
    return body('password')
        .custom((value, { req }) => {
            const user = req.user;
            if (!user.isValidPassword(value)) return next(new BadRequest('Invalid password. Please try again.'));
            return true;
        })(req, res, next);
};

/** * Validates that the refresh token cookie is present on the request.
 * @param {Object} req - The request object containing the refresh token cookie.
 * @returns {Promise<void>} - Resolves if the cookie is present, otherwise throws an error.
 */
const refreshTokenCookieValidator = (req, res, next) => {
    const token = req.cookies?.refresh_token;
    if (!token) return next(new NotAuthenticated());
    req.refreshToken = token;
    next();
};

/** * Validates that the provided refresh token exists in the database and has not been revoked.
 * @param {string} refreshToken - The refresh token to validate.
 * @returns {Promise<void>} - Resolves if the refresh token exists, otherwise throws an error.
 */
const refreshTokenExistsValidator = async (req, res, next) => {
    const payload = verifyRefreshToken(req.refreshToken);
    const { sub, jti } = payload;
    const record = await refreshTokenRepository.findByJti(jti);
    if (!record) {
        await refreshTokenRepository.revokeAllUserSessions(sub);
        clearRefreshCookie(res);
        return next(new TokenReuseDetected());
    }
    req.payload = payload;
    next();
}

module.exports = { 
    emailFieldValidator,
    emailRegisteredValidator,
    roleFieldValidator,
    registrationPasswordFieldValidator,
    passwordConfirmationFieldValidator,
    loginPasswordFieldValidator,
    emailExistsValidator,
    verifyPasswordValidator,
    refreshTokenCookieValidator,
    refreshTokenExistsValidator
};
