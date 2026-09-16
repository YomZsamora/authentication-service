const { v4: uuidv4 } = require('uuid');
const config = require('../configs/config');
const { getChannel } = require('../configs/rabbitmq');
const logger = require('pino')({ level: config.app.LOG_LEVEL });

const publishEvent = async (eventType, routingKey, payload) => {
    
    const channel = getChannel();

    if (!channel) {
        logger.warn({ eventType }, 'RabbitMQ channel unavailable — event not published');
        return;
    }

    const message = {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date().toISOString(),
        payload,
    };

    channel.publish(
        config.app.EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );

    logger.info({ eventId: message.eventId, eventType, routingKey }, 'Event published');
};

module.exports = { publishEvent };
