const amqp = require('amqplib');
const config = require('./config');
const logger = require('./logger');

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

let connection = null;
let channel = null;

const connect = async (attempt = 0) => {
    
    try {
        connection = await amqp.connect(config.app.AMQP_URL);
        channel = await connection.createChannel();

        logger.info('Connected to RabbitMQ');

        connection.on('error', (err) => {
            logger.error({ error: err.message }, 'RabbitMQ connection error');
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed — reconnecting');
            connection = null;
            channel = null;
            connect(0);
        });

    } catch (err) {
        logger.warn({ attempt: attempt + 1, error: err.message }, 'RabbitMQ connection attempt failed');

        if (attempt >= RECONNECT_DELAYS_MS.length - 1) {
            logger.fatal('Max reconnect attempts reached — exiting');
            process.exit(1);
        }

        const delay = RECONNECT_DELAYS_MS[attempt];
        logger.info({ delayMs: delay }, 'Retrying RabbitMQ connection');
        await new Promise((resolve) => setTimeout(resolve, delay));
        return connect(attempt + 1);
    }
};

const getChannel = () => channel;

module.exports = { connect, getChannel };