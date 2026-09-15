'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, _Sequelize) {
        await queryInterface.removeConstraint('users', 'users_googleSub_key');
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.addConstraint('users', {
            fields: ['googleSub'],
            type: 'unique',
            name: 'users_googleSub_key',
        });
    },
};
