/**
 * Controller for handling basic user registration.
 * This controller processes the registration request, creates a new user,
 * and returns a success response with the created user data.
 */
const { registerUser } = require('../../repositories/user-repository');
const { ApiResponse } = require('../../utils/responses')

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

module.exports = { basicRegistrationController };