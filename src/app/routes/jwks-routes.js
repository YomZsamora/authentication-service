const express = require('express');
const { getJWKSController } = require('../controllers/jwks-controller');

const router = express.Router();

router.get('/jwks.json', getJWKSController);

module.exports = router;