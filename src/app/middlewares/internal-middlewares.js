const { handleBadRequests } = require('../../utils/exceptions/exception-handler');
const { performerUserIdsValidator } = require('../../utils/validators/internal-validators');

const validatePerformersMiddleware = [
    performerUserIdsValidator,
    handleBadRequests('Performer user IDs validation failed. Please check the request body and try again.'),
];

module.exports = { validatePerformersMiddleware };
