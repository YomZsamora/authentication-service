const express = require('express');
const { 
    basicRegistrationMiddleware, 
    basicLoginMiddleware 
} = require('../middlewares/authentication-middlewares');
const { 
    basicRegistrationController, 
    basicLoginController 
} = require('../controllers/authentication-controller');

const router = express.Router();

router.post('/basic-registration', basicRegistrationMiddleware, basicRegistrationController);
router.post('/basic-login', basicLoginMiddleware, basicLoginController);

module.exports = router;
