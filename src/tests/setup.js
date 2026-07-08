'use strict';
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);
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
        const [results] = await adminSequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${test.database}'`);
        if (results.length === 0) {
            await adminSequelize.query(`CREATE DATABASE "${test.database}"`);
            console.log(`Test database "${test.database}" created.`);
        } else {
            console.log(`Test database "${test.database}" already exists. Skipping creation.`);
        }
    } catch (error) {
        console.error('Error during test database setup:', error);
        throw error;
    } finally {
        await adminSequelize.close();
    }

    try {
        const { stdout } = await execPromise('NODE_ENV=test npx sequelize-cli db:migrate');
        console.log('Migrations completed:', stdout);
    } catch (error) {
        console.error('Migration error:', error.stderr);
        throw error;
    }
};
