'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'googleSub', {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true,
        });

        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addIndex('users', ['googleSub'], {
            name: 'idx_users_googleSub',
            unique: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('users', 'idx_users_googleSub');

        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING,
            allowNull: false,
        });

        await queryInterface.removeColumn('users', 'googleSub');
    },
};