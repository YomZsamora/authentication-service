const { RefreshToken } = require('../models/refresh-token');

/** * Stores a new refresh token in the database.
 * @param {Object} params - The parameters for storing the refresh token.
 * @param {string} params.jti - The unique identifier for the refresh token.
 * @param {string} params.userId - The user ID associated with the refresh token.
 * @param {number} params.ttlSeconds - The time-to-live (TTL) in seconds for the refresh token.
 * @returns {Promise<Object>} - A promise that resolves to the created refresh token record.
 */
const storeRefreshToken = async ({ jti, userId, ttlSeconds }) => {
    const expiryDate = new Date(Date.now() + ttlSeconds * 1000);
    return RefreshToken.create({ jti, userId, expiryDate });
};

/** * Finds a refresh token record by its unique identifier (jti).
 * @param {string} jti - The unique identifier of the refresh token to find.
 * @returns {Promise<Object|null>} - A promise that resolves to the found refresh token record or null if not found.
 */
const findByJti = async (jti) => { // @TODO: Rename utul function. Only check. existence instead of returning the record.
    return RefreshToken.findOne({ where: { jti } }); 
};

/** * Deletes a refresh token record by its unique identifier (jti).
 * @param {string} jti - The unique identifier of the refresh token to delete.
 * @returns {Promise<number>} - A promise that resolves to the number of records deleted (0 or 1).
 */
const deleteByJti = async (jti) => {
    return RefreshToken.destroy({ where: { jti } });
};

/** * Revokes all refresh tokens associated with a specific user by deleting them from the database.
 * @param {string} userId - The user ID whose refresh tokens should be revoked.
 * @returns {Promise<number>} - A promise that resolves to the number of records deleted.
 */
const revokeAllUserSessions = async (userId) => {
    return RefreshToken.destroy({ where: { userId } });
};

module.exports = { 
    storeRefreshToken, 
    findByJti, 
    deleteByJti, 
    revokeAllUserSessions 
};
