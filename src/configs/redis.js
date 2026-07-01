const Redis = require('ioredis');
const env = process.env.NODE_ENV || 'development';
const config = require('./config');

const redis = new Redis(config.app.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log(`Connected to Redis successfully in ${env} environment.`));
redis.on('error', (err) => console.error(`Error connecting to Redis in ${env} environment:`, err));

module.exports = redis;
