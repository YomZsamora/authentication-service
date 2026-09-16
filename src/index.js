require('dotenv').config();
require('./configs/sequelize');
const express = require('express');
const config = require('./configs/config');
const cookieParser = require('cookie-parser');
const jwksRoutes = require('./app/routes/jwks-routes');
const authRoutes = require('./app/routes/auth-routes');
const oauthRoutes = require('./app/routes/oauth-routes');
const internalRoutes = require('./app/routes/internal-routes');
const logger = require('pino')({ level: config.app.LOG_LEVEL });
const { health } = require('./app/controllers/health-controller');
const { exceptionHandler } = require('./utils/exceptions/exception-handler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/health', health);
app.use('/.well-known', jwksRoutes);
app.use('/v1/auth/', authRoutes);
app.use('/v1/oauth/', oauthRoutes);
app.use('/v1/internal', internalRoutes);
app.use(exceptionHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info({ port: PORT }, 'Authentication service started');
    });
}

module.exports = app;
