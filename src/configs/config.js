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
        JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
        JWT_ISSUER: process.env.JWT_ISSUER,
        JWT_AUDIENCE: process.env.JWT_AUDIENCE,
        JWT_KEY_ID: process.env.JWT_KEY_ID,
        JWT_ACCESS_TOKEN_TTL: process.env.JWT_ACCESS_TOKEN_TTL,
        JWT_REFRESH_TOKEN_TTL: process.env.JWT_REFRESH_TOKEN_TTL,
    },
};
