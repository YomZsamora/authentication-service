const { Sequelize } = require('sequelize');
const { test } = require('../configs/config');

module.exports = async () => {
    const adminDatabase = 'postgres'; 
    const sequelize = new Sequelize(adminDatabase, test.username, test.password, {
        host: test.host,
        dialect: test.dialect,
    });
    
    try {
        await sequelize.authenticate();
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        await sequelize.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${test.database}'
            AND pid <> pg_backend_pid();
        `);
        await sequelize.query(`DROP DATABASE IF EXISTS "${test.database}"`);
        console.log(`Database ${test.database} dropped.`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};