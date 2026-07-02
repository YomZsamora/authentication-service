const { handleBadRequests } = require('../../utils/exceptions/exception-handler');
const {
    emailFieldValidator,
    emailRegisteredValidator,
    registrationPasswordFieldValidator,
    passwordConfirmationFieldValidator,
    loginPasswordFieldValidator,
    emailExistsValidator,
    verifyPasswordValidator
} = require('../../utils/validators/authentication-validators');

/**
 * Middleware for validating basic registration requests.
 * This middleware checks the validity of the email and password fields,
 * ensures that the email is not already registered, and confirms that
 * the password and password confirmation match.
 */
const basicRegistrationMiddleware = [
    emailFieldValidator,
    emailRegisteredValidator,
    registrationPasswordFieldValidator,
    passwordConfirmationFieldValidator,
    handleBadRequests('Error occurred during registration.')
];

/** * Middleware for validating basic login requests.
 * This middleware checks the validity of the email and password fields,
 * ensures that the email exists in the database, and verifies that
 * the provided password matches the stored password for that user.
 */
const basicLoginMiddleware = [
    emailFieldValidator,
    loginPasswordFieldValidator,
    handleBadRequests('Error occurred during login.'),
    emailExistsValidator,
    verifyPasswordValidator
];

module.exports = { 
    basicRegistrationMiddleware, 
    basicLoginMiddleware 
};