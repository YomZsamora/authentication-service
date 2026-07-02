const redis = require('../configs/redis');

/** * Stores a refresh token in Redis with the specified TTL.
 * @param {Object} params - The parameters for storing the refresh token.
 * @param {string} params.jti - The unique identifier for the token.
 * @param {string} params.userId - The ID of the user associated with the token.
 * @param {number} params.ttlSeconds - The time-to-live for the token in seconds.
 */
const storeRefreshToken = async ({ jti, userId, ttlSeconds }) => {
    const record = JSON.stringify({ jti, userId, used: false });
    await redis.set(`refresh:${jti}`, record, 'EX', ttlSeconds);
    await redis.sadd(`user_sessions:${userId}`, jti);
};

/** * Retrieves a refresh token record from Redis by its unique identifier (jti).
 * @param {string} jti - The unique identifier of the refresh token.
 * @returns {Promise<Object|null>} - The refresh token record if found, otherwise null.
 */
const getRefreshRecord = async (jti) => {
    const record = await redis.get(`refresh:${jti}`);
    return record ? JSON.parse(record) : null;
};

/** * Marks a refresh token as used in Redis.
 * @param {string} jti - The unique identifier of the refresh token to mark as used.
 */
const markUsed = async (jti) => {
    const record = await getRefreshRecord(jti);
    if (!record) return;
    await redis.set(`refresh:${jti}`, JSON.stringify({ ...record, used: true }), 'KEEPTTL');
};

/** * Revokes all active sessions for a user by deleting their refresh tokens from Redis.
 * @param {string} userId - The ID of the user whose sessions are to be revoked.
 */
const revokeAllUserSessions = async (userId) => {
    const jtis = await redis.smembers(`user_sessions:${userId}`);
    if (jtis.length) {
        await redis.del(...jtis.map((jti) => `refresh:${jti}`));
    }
    await redis.del(`user_sessions:${userId}`);
};

/** * Denylists a token by storing its unique identifier (jti) in Redis with a specified TTL.
 * @param {Object} params - The parameters for denylisting the token.
 * @param {string} params.jti - The unique identifier of the token to denylist.
 * @param {number} params.ttlSeconds - The time-to-live for the denylist entry in seconds.
 */
const denylistToken = async ({ jti, ttlSeconds }) => {
    await redis.set(`denylist:${jti}`, '1', 'EX', ttlSeconds);
};

/** * Checks if a token is denylisted by looking up its unique identifier (jti) in Redis.
 * @param {string} jti - The unique identifier of the token to check.
 * @returns {Promise<boolean>} - Returns true if the token is denylisted, otherwise false.
 */
const isDenylisted = async (jti) => {
    const result = await redis.exists(`denylist:${jti}`);
    return result === 1;
};

module.exports = { 
    storeRefreshToken, 
    getRefreshRecord, 
    markUsed, 
    revokeAllUserSessions, 
    denylistToken, 
    isDenylisted 
};