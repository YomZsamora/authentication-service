const express = require('express');
const { 
    basicRegistrationMiddleware, 
    basicLoginMiddleware,
    refreshTokenMiddleware
} = require('../middlewares/authentication-middlewares');
const { 
    basicRegistrationController, 
    basicLoginController,
    refreshTokenController,
    logoutController
} = require('../controllers/authentication-controller');

const router = express.Router();

router.post('/basic-registration', basicRegistrationMiddleware, basicRegistrationController);
router.post('/basic-login', basicLoginMiddleware, basicLoginController);
router.post('/refresh-token', refreshTokenMiddleware, refreshTokenController);
router.post('/logout', logoutController);

module.exports = router;
