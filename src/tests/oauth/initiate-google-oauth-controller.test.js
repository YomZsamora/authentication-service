'use strict';

const request = require('supertest');
const app = require('../../index');
const config = require('../../configs/config');
const pkceService = require('../../services/pkce-service');
const { initiateGoogleOAuthController } = require('../../app/controllers/oauth-controllers');

describe('Initiate Google OAuth API - GET /v1/oauth/google', () => {

    describe('Success', () => {

        it('should return 302 and redirect to Google with all required OAuth 2.0 parameters', async () => {
            const res = await request(app)
                .get('/v1/oauth/google');

            expect(res.status).toBe(302);

            // Location header must point to Google's authorization endpoint
            expect(res.headers.location).toBeDefined();
            const url = new URL(res.headers.location);
            expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');

            // Required OAuth 2.0 and PKCE params
            expect(url.searchParams.get('client_id')).toBe(config.google.GOOGLE_CLIENT_ID);
            expect(url.searchParams.get('redirect_uri')).toBe(config.google.GOOGLE_CALLBACK_URL);
            expect(url.searchParams.get('response_type')).toBe('code');
            expect(url.searchParams.get('scope')).toBe('openid email profile');
            expect(url.searchParams.get('code_challenge_method')).toBe('S256');

            // These are generated fresh per request — assert presence and non-empty
            expect(url.searchParams.get('code_challenge').length).toBeGreaterThan(0);
            expect(url.searchParams.get('state').length).toBeGreaterThan(0);
            expect(url.searchParams.get('nonce').length).toBeGreaterThan(0);
        });

        it('should store the PKCE code verifier and nonce in Redis under the state key', async () => {
            const res = await request(app)
                .get('/v1/oauth/google');

            // Extract the state from the redirect URL
            const url = new URL(res.headers.location);
            const state = url.searchParams.get('state');

            // Verify Redis entry
            const stored = await pkceService.getOAuthState(state);
            expect(stored).not.toBeNull();
            expect(typeof stored.codeVerifier).toBe('string');
            expect(stored.codeVerifier.length).toBeGreaterThan(0);
            expect(typeof stored.nonce).toBe('string');
            expect(stored.nonce.length).toBeGreaterThan(0);

            // Clean up — the callback test will not use this state
            await pkceService.deleteOAuthState(state);
        });

    });

    describe('Error propagation', () => {
        it('should call next() with an error if the controller throws', async () => {
            const spy = jest.spyOn(pkceService, 'storeOAuthState')
                .mockRejectedValueOnce(new Error('Redis unavailable'));

            const req = {};
            const res = {};
            const next = jest.fn();

            await initiateGoogleOAuthController(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));

            spy.mockRestore();
        });
    });
});