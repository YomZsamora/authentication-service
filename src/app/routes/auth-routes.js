const express = require('express');
const { 
    basicRegistrationMiddleware, 
    basicLoginMiddleware,
    refreshTokenMiddleware
} = require('../middlewares/auth-middlewares');
const { 
    basicRegistrationController, 
    basicLoginController,
    refreshTokenController,
    logoutController
} = require('../controllers/auth-controllers');

const router = express.Router();

router.post('/basic-registration', basicRegistrationMiddleware, basicRegistrationController);
router.post('/basic-login', basicLoginMiddleware, basicLoginController);
router.post('/refresh-token', refreshTokenMiddleware, refreshTokenController);
router.post('/logout', logoutController);

module.exports = router;
