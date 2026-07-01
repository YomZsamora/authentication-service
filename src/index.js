const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { exceptionHandler } = require('./utils/exceptions/exception-handler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.get('/health', (req, res) => res.send('The authentication service is running.'));
app.use(exceptionHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
