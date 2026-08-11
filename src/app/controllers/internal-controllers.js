const { ApiResponse } = require('../../utils/responses');
const userRepository = require('../../repositories/user-repository');

const validatePerformersController = async (req, res, next) => {
    try {

        const { performerUserIds } = req.body;
        const users = await userRepository.findUsersByIds(performerUserIds);
        const validPerformerIds = new Set(
            users.filter((u) => u.role === 'PERFORMER').map((u) => u.id)
        );
        const invalidIds = performerUserIds.filter((id) => !validPerformerIds.has(id));
        const apiResponse = new ApiResponse();
        apiResponse.message = 'Performers validated successfully.';
        apiResponse.data = {
            valid: invalidIds.length === 0,
            invalidIds,
        };
        return res.status(200).json(apiResponse);
    } catch (error) {
        next(error);
    }
};

module.exports = { validatePerformersController };
