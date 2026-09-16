'use strict';

const request = require('supertest');
const app = require('../../index');

describe('GET /health', () => {
    it('should return 200 with db and redis status fields', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toMatchObject({
            db: expect.stringMatching(/^(connected|disconnected)$/),
            redis: expect.stringMatching(/^(connected|disconnected)$/),
        });
    });

    it('should report db as connected when the test database is reachable', async () => {
        const res = await request(app).get('/health');

        expect(res.body.data.db).toBe('connected');
    });

    it('should report redis as connected when the redis instance is reachable', async () => {
        const res = await request(app).get('/health');

        expect(res.body.data.redis).toBe('connected');
    });
});
