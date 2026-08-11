const { body } = require('express-validator');
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const performerUserIdsValidator = body('performerUserIds')
    .exists({ checkNull: true }).withMessage('performerUserIds is required.')
    .isArray({ min: 1 }).withMessage('performerUserIds must be a non-empty array.')
    .custom((ids) => {
        const invalidItems = ids.filter((id) => typeof id !== 'string' || !UUID_REGEX.test(id));
        if (invalidItems.length > 0) throw new Error('All items in performerUserIds must be valid UUIDs.');
        const uniqueIds = new Set(ids);
        if (uniqueIds.size !== ids.length) throw new Error('performerUserIds must not contain duplicates.');
        return true;
    });

module.exports = { performerUserIdsValidator };
    