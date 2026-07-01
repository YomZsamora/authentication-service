
class BadRequest extends Error {

    constructor(message, errors = null) {
        super(message);
        this.name = "BadRequest";
        this.errors = errors;
        this.statusCode = 400;
    }
}

class NotFound extends Error {

    constructor(message) {
        super(message);
        this.name = "NotFound";
        this.statusCode = 404;
    }
}

class NotAuthenticated extends Error {

    constructor() {
        super("Authentication credentials were not provided.");
        this.statusCode = 401
        this.name = "NotAuthenticated";
    }
}

class PermissionDenied extends Error {

    constructor() {
        super("You don't have required permission to perform this action.");
        this.statusCode = 403
        this.name = "PermissionDenied";
    }
}

class UnprocessedEntity extends Error {

    constructor() {
        super("The request could not be processed. Please try again later.");
        this.statusCode = 422
        this.name = "UnprocessedEntity";
    }
}

module.exports = { 
    BadRequest, 
    NotFound, 
    NotAuthenticated, 
    PermissionDenied,
    UnprocessedEntity
};
