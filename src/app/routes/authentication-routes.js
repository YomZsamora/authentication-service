const express = require('express');
const { basicRegistrationMiddleware } = require('../middlewares/authentication-middlewares');
const { basicRegistrationController } = require('../controllers/authentication-controller');

const router = express.Router();

router.post('/basic-registration', basicRegistrationMiddleware, basicRegistrationController);

module.exports = router;
