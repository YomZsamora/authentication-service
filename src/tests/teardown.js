'use strict';
const { Sequelize } = require('sequelize');
const { test } = require('../configs/config');

module.exports = async () => {

    const adminSequelize = new Sequelize('postgres', test.username, test.password, {
        host: test.host,
        dialect: 'postgres',
        logging: false,
    });

    try {
        await adminSequelize.authenticate();
        await adminSequelize.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${test.database}'
            AND pid <> pg_backend_pid()
        `);
        await adminSequelize.query(`DROP DATABASE IF EXISTS "${test.database}"`);
        console.log(`Test database "${test.database}" dropped.`);
    } catch (error) {
        console.error('Error during teardown:', error);
    } finally {
        await adminSequelize.close();
    }
};
