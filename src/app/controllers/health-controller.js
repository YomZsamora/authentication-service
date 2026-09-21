'use strict';

const redis = require('../../configs/redis');
const sequelize = require('../../configs/sequelize');
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
        const apiResponse = new ApiResponse(200, 'Authentication service is running', {
            db: dbStatus,
            redis: redisStatus,
        });
        return res.status(apiResponse.statusCode).json(apiResponse);
    } catch (err) {
        next(err);
    }
};

module.exports = { health };
