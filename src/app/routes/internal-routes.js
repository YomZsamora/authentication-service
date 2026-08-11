const express = require('express');
const { validatePerformersMiddleware } = require('../middlewares/internal-middlewares');
const { validatePerformersController } = require('../controllers/internal-controllers');

const router = express.Router();

router.post('/users/validate-performers', validatePerformersMiddleware, validatePerformersController);

module.exports = router;
