const express = require('express');
const { 
    initiateGoogleOAuthController,
    callbackGoogleOAuthController
} = require('../controllers/oauth-controllers');
const { 
    initiateGoogleOAuthMiddleware,
    callbackGoogleOAuthMiddleware
} = require('../middlewares/oauth-middlewares');

const router = express.Router();

router.get('/google', initiateGoogleOAuthMiddleware, initiateGoogleOAuthController);
router.get('/google/callback', callbackGoogleOAuthMiddleware, callbackGoogleOAuthController);

module.exports = router;
