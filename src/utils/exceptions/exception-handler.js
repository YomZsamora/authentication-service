const { validationResult } = require('express-validator');
const { ApiResponse, ERROR_STATUS } = require('../responses');
const { 
    BadRequest, 
    NotFound, 
    NotAuthenticated,
    PermissionDenied
} = require('./custom-exceptions');

const exceptionHandler = (err, req, res, next) => {

    const apiResponse = new ApiResponse();
    apiResponse.code = err.statusCode || 500;
    apiResponse.status = ERROR_STATUS;
    apiResponse.message = err.message || "Internal Server Error";
    apiResponse.data = err.errors || {};

    if (err instanceof BadRequest) {
        apiResponse.code = err.statusCode;
        apiResponse.message = err.message;
        apiResponse.data = err.errors;
    }

    if (err instanceof NotFound) {
        apiResponse.code = err.statusCode;
        apiResponse.message = err.message;
    }

    if (err instanceof NotAuthenticated) {
        apiResponse.code = err.statusCode;
        apiResponse.message = err.message;
    }

    if (err instanceof PermissionDenied) {
        apiResponse.code = err.statusCode;
        apiResponse.message = err.message;
    }

    return res.status(apiResponse.code).json(apiResponse);
}

const formatExceptions = (errors) => {
    return Object.fromEntries(
        Object.entries(errors.mapped()).map(([field, error]) => [
            field,
            error.msg
        ])
    );
};

const formatLoggerExceptions = (errors) => {
    return errors && typeof errors === 'object' 
            ? Object.values(errors).join(', ') 
            : errors;
}

const handleBadRequests = (errorMessage = "Validation failed.") => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequest(errorMessage, formatExceptions(errors));
        }
        next();
    };
};

const handleNotFoundErrors = (errorMessage = "Resource not found.") => {
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
    handleNotFoundErrors
};
