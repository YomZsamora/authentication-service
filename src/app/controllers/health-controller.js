'use strict';

const sequelize = require('../../configs/sequelize');
const redis = require('../../configs/redis');
const { ApiResponse } = require('../../utils/responses');

const health = async (req, res, next) => {
    try {
        let dbStatus = 'connected';
        let redisStatus = 'connected';

        try {
            await sequelize.authenticate();
        } catch {
            dbStatus = 'disconnected';
        }

        if (redis.status !== 'ready') redisStatus = 'disconnected';

        const apiResponse = new ApiResponse();
        apiResponse.message = 'Service is running';
        apiResponse.data = { db: dbStatus, redis: redisStatus };
        return res.status(200).json(apiResponse);
    } catch (err) {
        next(err);
    }
};

module.exports = { health };
