/**
 * This file sets up the test environment for our API tests. It mocks the WeatherForecastService to return 
 * consistent data, and ensures that the server is properly started and stopped for testing. 
 */

const server = require('../index');

process.env.PORT = 0;
process.env.NODE_ENV = 'test';

afterAll(() => server.close());