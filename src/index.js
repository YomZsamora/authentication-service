const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const sequelize = require('./configs/sequelize');
const jwksRoutes = require('./app/routes/jwks-routes');
const authRoutes = require('./app/routes/auth-routes');
const oauthRoutes = require('./app/routes/oauth-routes');
const internalRoutes = require('./app/routes/internal-routes');
const { exceptionHandler } = require('./utils/exceptions/exception-handler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.get('/health', (req, res) => res.send('The authentication service is running.'));
app.use('/.well-known', jwksRoutes);
app.use('/v1/auth/', authRoutes);
app.use('/v1/oauth/', oauthRoutes);
app.use('/v1/internal', internalRoutes);
app.use(exceptionHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
