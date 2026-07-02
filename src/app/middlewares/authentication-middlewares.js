const { handleBadRequests } = require('../../utils/exceptions/exception-handler');
const {
    emailFieldValidator,
    emailRegisteredValidator,
    registrationPasswordFieldValidator,
    passwordConfirmationFieldValidator,
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

module.exports = { basicRegistrationMiddleware };