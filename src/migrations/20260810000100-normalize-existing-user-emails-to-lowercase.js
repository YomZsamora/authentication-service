'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('UPDATE users SET email = LOWER(TRIM(email))');
    },

    async down(queryInterface, Sequelize) {
        // Original casing is not recoverable — normalization is a one-way data migration.
    },
};
