const ERROR_STATUS = "error";
const SUCCESS_STATUS = "success";

class ApiResponse {

    constructor() {
        this.code = 200;
        this.status = SUCCESS_STATUS;
        this.message = "";
        this.data = null;
    }
}

module.exports = { ApiResponse, ERROR_STATUS };
