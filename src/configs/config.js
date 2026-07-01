require('dotenv').config();
const fs = require('fs');

module.exports = {
    development: {
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        host: process.env.POSTGRES_HOST,
        dialect: 'postgres',
    },
    staging: {},
    production: {},
    test: {},
    app: {
        REDIS_URL: process.env.REDIS_URL,
    },
};
