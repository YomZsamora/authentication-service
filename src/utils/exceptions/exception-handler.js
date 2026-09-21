const { validationResult } = require('express-validator');
const { ApiResponse } = require('../responses');
const logger = require('../logger');
const { BadRequest, NotFound } = require('./custom-exceptions');

const exceptionHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const data = err.errors || {};

    const apiResponse = new ApiResponse(statusCode, message, data);
    apiResponse.status = 'error';

    if (statusCode >= 500) {
        logger.error({ statusCode, error: err.message, stack: err.stack, path: req.path }, 'Unexpected error');
    } else {
        logger.warn({ statusCode, error: err.message, path: req.path }, 'Operational error');
    }

    return res.status(statusCode).json(apiResponse);
};

const formatExceptions = (errors) => {
    return Object.fromEntries(
        Object.entries(errors.mapped()).map(([field, error]) => [field, error.msg])
    );
};

const formatLoggerExceptions = (errors) => {
    return errors && typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
};

const handleBadRequests = (errorMessage = 'Validation failed.') => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequest(errorMessage, formatExceptions(errors));
        }
        next();
    };
};

const handleNotFoundErrors = (errorMessage = 'Resource not found.') => {
    return (req, res, next) => {
        const resource = req.resource;
        if (!resource) {
            throw new NotFound(errorMessage);
        }
        next();
    };
};

module.exports = {
    exceptionHandler,
    formatExceptions,
    formatLoggerExceptions,
    handleBadRequests,
    handleNotFoundErrors,
};
