'use strict';

const request = require('supertest');
const app = require('../../index');
const { User } = require('../../models/user');
const { validatePerformersController } = require('../../app/controllers/internal-controllers');

const TEST_PERFORMER_USER_ID     = '00000000-0000-0000-0000-000000000006';
const TEST_NON_PERFORMER_USER_ID = '00000000-0000-0000-0000-000000000007';

describe('Validate Performers API - POST /v1/internal/users/validate-performers', () => {

    beforeAll(async () => {
        await User.create({
            id: TEST_PERFORMER_USER_ID,
            email: 'performer@internal.test.com',
            role: 'PERFORMER',
        });
        await User.create({
            id: TEST_NON_PERFORMER_USER_ID,
            email: 'nonperformer@internal.test.com',
            role: 'USER',
        });
    });

    afterAll(async () => {
        await User.destroy({
            where: { id: [TEST_PERFORMER_USER_ID, TEST_NON_PERFORMER_USER_ID] },
        });
    });

    describe('Body Validation', () => {

        it('should return 400 if userIds is missing', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ status: 'error' });
        });

        it('should return 400 if userIds is not an array', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: 'not-an-array' });

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ status: 'error' });
        });

        it('should return 400 if userIds is an empty array', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [] });

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ status: 'error' });
        });

        it('should return 400 if userIds contains invalid UUIDs', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: ['not-a-uuid', TEST_PERFORMER_USER_ID] });

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ status: 'error' });
        });

        it('should return 400 if userIds contains duplicates', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [TEST_PERFORMER_USER_ID, TEST_PERFORMER_USER_ID] });

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({ status: 'error' });
        });
    });

    describe('Success', () => {

        it('should return valid: true when all IDs belong to PERFORMER users', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [TEST_PERFORMER_USER_ID] });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.valid).toBe(true);
            expect(res.body.data.invalidIds).toEqual([]);
        });

        it('should return valid: false with invalidIds when a user ID does not exist', async () => {
            const nonExistentId = '00000000-0000-0000-0000-999999999999';

            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [nonExistentId] });

            expect(res.status).toBe(200);
            expect(res.body.data.valid).toBe(false);
            expect(res.body.data.invalidIds).toContain(nonExistentId);
        });

        it('should return valid: false with invalidIds when a user exists but is not a PERFORMER', async () => {
            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [TEST_NON_PERFORMER_USER_ID] });

            expect(res.status).toBe(200);
            expect(res.body.data.valid).toBe(false);
            expect(res.body.data.invalidIds).toContain(TEST_NON_PERFORMER_USER_ID);
        });

        it('should return valid: false with only the invalid IDs when a mix is provided', async () => {
            const nonExistentId = '00000000-0000-0000-0000-999999999998';

            const res = await request(app)
                .post('/v1/internal/users/validate-performers')
                .send({ userIds: [TEST_PERFORMER_USER_ID, TEST_NON_PERFORMER_USER_ID, nonExistentId] });

            expect(res.status).toBe(200);
            expect(res.body.data.valid).toBe(false);
            expect(res.body.data.invalidIds).toEqual(
                expect.arrayContaining([TEST_NON_PERFORMER_USER_ID, nonExistentId])
            );
            expect(res.body.data.invalidIds).not.toContain(TEST_PERFORMER_USER_ID);
        });
    });

    describe('Error propagation', () => {

        it('should call next() with an error if the controller throws', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            await validatePerformersController(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
