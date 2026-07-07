/**
 * @file user-serializer.js
 * @description This file contains functions to serialize user data for API responses.
 */

/**
 * Serializes a user object for API responses.
 * @param {Object} user - The user object to serialize.
 * @returns {Object} The serialized user object.
 */
const serializeUser = (user) => ({
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

/** * Serializes a user object for authentication responses.
 * @param {Object} user - The user object to serialize.
 * @returns {Object} The serialized user object for authentication.
 */
const serializeAuthUser = (user) => ({
    userId: user.id,
    email: user.email,
    role: user.role,
});

module.exports = { serializeUser, serializeAuthUser };
