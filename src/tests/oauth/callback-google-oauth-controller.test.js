'use strict';

const request = require('supertest');
const app = require('../../index');
const { User } = require('../../models/user');
const { RefreshToken } = require('../../models/refresh-token');
const pkceService = require('../../services/pkce-service');
const { GoogleOAuthService } = require('../../services/google-oauth-service');
const { callbackGoogleOAuthController } = require('../../app/controllers/oauth-controllers');

const TEST_GOOGLE_SUB   = 'google-sub-callback-test';
const TEST_GOOGLE_EMAIL = 'callbacktest@gmail.com';
const TEST_STATE        = 'test-oauth-state-abc123';
const TEST_CODE         = 'test-auth-code-xyz789';
const TEST_CODE_VERIFIER = 'test-code-verifier';
const TEST_NONCE        = 'test-nonce';

describe('Google OAuth Callback API - GET /v1/oauth/google/callback', () => {

    let mockGoogleOAuthHandle;

    beforeEach(async () => {
        // Intercept Google's token exchange — no real network call
        mockGoogleOAuthHandle = jest.spyOn(GoogleOAuthService.prototype, 'handle')
            .mockResolvedValue({ sub: TEST_GOOGLE_SUB, email: TEST_GOOGLE_EMAIL });

        // Pre-load a valid PKCE state into Redis so verifyOAuthStateValidator passes
        await pkceService.storeOAuthState(TEST_STATE, {
            codeVerifier: TEST_CODE_VERIFIER,
            nonce: TEST_NONCE,
        });
    });

    afterEach(async () => {
        mockGoogleOAuthHandle.mockRestore();

        // Delete Redis state — verifyOAuthStateValidator consumes it on success,
        // but it may still be present if the test failed before reaching the controller
        await pkceService.deleteOAuthState(TEST_STATE);

        // Clean up DB records created by findOrCreateGoogleUser
        const user = await User.findOne({ where: { googleSub: TEST_GOOGLE_SUB } });
        if (user) {
            await RefreshToken.destroy({ where: { userId: user.id } });
            await User.destroy({ where: { id: user.id } });
        }
    });

    describe('Validation', () => {

        it('should return 400 if state query parameter is missing', async () => {
            const res = await request(app)
                .get('/v1/oauth/google/callback')
                .query({ code: TEST_CODE });  // state is absent

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                status: 'error',
                message: 'Error occurred during Google OAuth callback.',
            });
            expect(res.body.data).toHaveProperty('state', 'state is required.');
        });

        it('should return 400 if code query parameter is missing', async () => {
            const res = await request(app)
                .get('/v1/oauth/google/callback')
                .query({ state: 'anyvalue' });  // code is absent

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                status: 'error',
                message: 'Error occurred during Google OAuth callback.',
            });
            expect(res.body.data).toHaveProperty('code', 'code is required.');
        });

        it('should return 400 if the state is not found in Redis', async () => {
            const res = await request(app)
                .get('/v1/oauth/google/callback')
                .query({ state: 'nonexistentstate', code: TEST_CODE });

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                status: 'error',
                message: 'Invalid or expired OAuth state.',
                data: null,
            });
        });

    });

    describe('Success', () => {
        it('should return 200 with access and refresh tokens and set refresh_token cookie', async () => {
            const res = await request(app)
                .get('/v1/oauth/google/callback')
                .query({ state: TEST_STATE, code: TEST_CODE });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                status: 'success',
                message: 'Google OAuth authentication successful.',
            });

            const { data } = res.body;
            expect(typeof data.accessToken).toBe('string');
            expect(data.accessToken.length).toBeGreaterThan(0);
            expect(typeof data.refreshToken).toBe('string');
            expect(data.refreshToken.length).toBeGreaterThan(0);
            expect(data.tokenType).toBe('Bearer');

            // Refresh token also set as an HttpOnly cookie
            const setCookieHeader = res.headers['set-cookie'];
            expect(setCookieHeader).toBeDefined();
            const refreshCookie = setCookieHeader.find(c => c.startsWith('refresh_token='));
            expect(refreshCookie).toBeDefined();
            expect(refreshCookie).toContain('HttpOnly');
            expect(refreshCookie).toContain('Path=/v1/auth/refresh-token');

            // Verify the user was created in the DB with the mocked Google sub
            const user = await User.findOne({ where: { googleSub: TEST_GOOGLE_SUB } });
            expect(user).not.toBeNull();
            expect(user.email).toBe(TEST_GOOGLE_EMAIL);
            expect(user.role).toBe('USER');
        });

    });

    describe('Error propagation', () => {
        it('should call next() with an error if the controller throws', async () => {
            const req = {};
            const res = {};
            const next = jest.fn();

            await callbackGoogleOAuthController(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

});