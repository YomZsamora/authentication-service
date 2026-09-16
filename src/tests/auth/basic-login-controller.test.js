'use strict';

const app = require('../../index');
const request = require('supertest');
const { faker } = require('@faker-js/faker');
const { User } = require('../../models/user');
const { RefreshToken } = require('../../models/refresh-token');
const { basicLoginController } = require('../../app/controllers/auth-controllers');

const TEST_EMAIL = faker.internet.email();
const TEST_PASSWORD = faker.internet.password({ length: 8 });

describe('Basic Login API - POST /v1/auth/basic-login', () => {
    
    let loginUser;
    let validPayload;

    beforeAll(async () => {
        loginUser = await User.create({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'USER',
        });
    });

    beforeEach(() => {
        validPayload = {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        };
    });

    afterAll(async () => {
        await RefreshToken.destroy({ where: { userId: loginUser.id } });
        await User.destroy({ where: { id: loginUser.id } });
    });

    it('should return 400 if email is not a valid format', async () => {
        validPayload.email = 'not-an-email';
        const res = await request(app)
            .post('/v1/auth/basic-login')
            .send(validPayload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message', 'Error occurred during login.');

        expect(res.body.data).toHaveProperty('email', 'Valid email address is required.');
    });

    it('should return 400 if password is missing', async () => {
        delete validPayload.password;
        const res = await request(app)
            .post('/v1/auth/basic-login')
            .send(validPayload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message', 'Error occurred during login.');

        expect(res.body.data).toHaveProperty('password', 'Password is required.');
    });

    it('should return 404 if the email is not registered', async () => {
        validPayload.email = 'nobody@test.local';
        const res = await request(app).post('/v1/auth/basic-login').send(validPayload);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('status', 'error');
        expect(res.body).toHaveProperty('message', 'User account not found. Please check your email and try again.');
    });

    it('should return 400 if the password is incorrect', async () => {
        validPayload.password = 'WrongPass(0)';
        const res = await request(app)
            .post('/v1/auth/basic-login')
            .send(validPayload);
        console.log(res.body);
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
            status: 'error',
            message: 'Invalid password. Please try again.',
        });
        expect(res.body.data).toBeNull();
    });

    it('should return 200 with an access token and set a refresh token cookie', async () => {
        const res = await request(app).post('/v1/auth/basic-login').send(validPayload);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            status: 'success',
            message: 'Logged in successfully.',
        });

        const { accessToken, tokenType, expiresIn } = res.body.data;

        expect(typeof accessToken).toBe('string');
        expect(accessToken.length).toBeGreaterThan(0);
        expect(tokenType).toBe('Bearer');
        expect(typeof expiresIn).toBe('number');
        expect(expiresIn).toBeGreaterThan(0);

        // Refresh token must be set as an HttpOnly cookie
        const setCookieHeader = res.headers['set-cookie'];
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader[0]).toContain('refresh_token=');
        expect(setCookieHeader[0]).toContain('HttpOnly');
        expect(setCookieHeader[0]).toContain('Path=/v1/auth/refresh-token');
    });

    it('should call next() with an error if the controller throws', async () => {
        const req = { user: null }; // user is null → user.id throws TypeError
        const res = {};
        const next = jest.fn();
        await basicLoginController(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
