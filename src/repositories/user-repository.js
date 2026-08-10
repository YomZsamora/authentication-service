const { User } = require('../models/user');

/**
 * Registers a new user in the database.
 * @param {Object} userData - The user data containing email, password, and optional role.
 * @returns {Promise<Object>} - The created user object.
 */
const registerUser = async ({ email, password, role = 'USER' }) => {
    return User.create({ email, password, role });
};

/**
 * Finds a user by their email address.
 * @param {string} email - The email address of the user to find.
 * @returns {Promise<Object|null>} - The found user object or null if not found.
 */
const findUserByEmail = async (email) => {
    return User.findOne({ where: { email: email.trim().toLowerCase() } });
};

/** * Finds a user by their unique identifier (ID).
 * @param {string} id - The unique identifier of the user to find.
 * @returns {Promise<Object|null>} - The found user object or null if not found.
 */
const findUserById = async (id) => {
    return User.findByPk(id);
};

/** * Finds a user by their Google sub or creates a new user if not found.
 * @param {Object} params - The parameters for finding or creating the user.
 * @param {string} params.googleSub - The Google sub of the user.
 * @param {string} params.email - The email address of the user.
 * @returns {Promise<Object>} - The found or created user object.
 */
const findOrCreateGoogleUser = async ({ googleSub, email }) => {
    let user = await User.findOne({ where: { googleSub } });
    if (user) return user;
    user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (user) {
        await user.update({ googleSub });
        return user;
    }
    return User.create({ googleSub, email, role: 'USER' });
};

const userEmailExists = async (email) => {
    const user = await User.findOne({
        where: { email: email.trim().toLowerCase() },
        attributes: ['email'],
    });
    return !!user;
}

module.exports = { 
    registerUser, 
    findUserByEmail, 
    findUserById,
    findOrCreateGoogleUser,
    userEmailExists
};
