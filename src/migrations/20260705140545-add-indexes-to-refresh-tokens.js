'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.addIndex('refresh_tokens', ['userId'], {
            name: 'idx_refresh_tokens_userId',
        });
        await queryInterface.addIndex('refresh_tokens', ['jti'], {
            name: 'idx_refresh_tokens_jti',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_jti');
        await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_userId');
    },
};
