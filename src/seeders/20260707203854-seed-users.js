'use strict';
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');

const SEED_BATCH_DATE = new Date('2026-07-07T00:00:00.000Z');
const HASHED_PASSWORD = bcrypt.hashSync('P@ssw0rd!', 10);

const createUsers = (count, role, emailPrefix) =>
    Array.from({ length: count }).map((_, index) => ({
        id: randomUUID(),
        email: `${emailPrefix}${index + 1}@seed.local`,
        password: HASHED_PASSWORD,
        role,
        googleSub: null,
        createdAt: SEED_BATCH_DATE,
        updatedAt: SEED_BATCH_DATE,
    }));

module.exports = {
    async up(queryInterface) {
        const users = [
            ...createUsers(10, 'USER',      'user'),
            ...createUsers(5,  'VENUE',     'venue'),
            ...createUsers(3,  'PERFORMER', 'performer'),
            ...createUsers(2,  'ADMIN',     'admin'),
        ];

        await queryInterface.bulkInsert('users', users, { ignoreDuplicates: true });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', {
            email: { [Sequelize.Op.like]: '%@seed.local' },
        }, {});
    },
};