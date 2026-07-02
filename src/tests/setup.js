const { Sequelize } = require('sequelize');
const { test } = require('../configs/config');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = async () => {

    const sequelize = new Sequelize('', test.username, test.password, { host: test.host, dialect: test.dialect });
    try {
        await sequelize.authenticate();
        console.log('Connection to the test database has been established successfully.');
        const [results] = await sequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${test.database}'`);
        if (results.length === 0) {
            await sequelize.query(`CREATE DATABASE "${test.database}"`);
            console.log(`Database ${test.database} created successfully.`);
        } else {
            console.log(`Database ${test.database} already exists. Skipping creation.`);
        }
        console.log('Running migrations...');
        await execPromise('npx sequelize-cli db:migrate');
        console.log('Migrations completed successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
