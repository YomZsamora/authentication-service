'use strict';

const request = require('supertest');
const app = require('../../index');
const config = require('../../configs/config');

describe('JWKS API - GET /.well-known/jwks.json', () => {

    it('should return 200 with Content-Type application/json and a keys array', async () => {
        const res = await request(app)
            .get('/.well-known/jwks.json');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body).toHaveProperty('keys');
        expect(Array.isArray(res.body.keys)).toBe(true);
        expect(res.body.keys).toHaveLength(1);
    });

    it('should return a single RSA signing key with all required JWK fields', async () => {
        const res = await request(app)
            .get('/.well-known/jwks.json');

        const key = res.body.keys[0];
        expect(key.kty).toBe('RSA');
        expect(key.use).toBe('sig');
        expect(key.alg).toBe('RS256');
        expect(key.kid).toBe(config.app.JWT_KEY_ID);
        expect(typeof key.n).toBe('string');
        expect(key.n.length).toBeGreaterThan(0);
        expect(typeof key.e).toBe('string');
        expect(key.e.length).toBeGreaterThan(0);
    });
});
