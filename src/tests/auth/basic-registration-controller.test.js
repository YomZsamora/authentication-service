'use strict';

const request = require('supertest');
const app = require('../../index');
const { User } = require('../../models/user');
const { basicRegistrationController } = require('../../app/controllers/auth-controllers');

describe('Basic Registration API - POST /v1/auth/basic-registration', () => {

    let validPayload;
    let existingUser;

    beforeAll(async () => {
        existingUser = await User.create({
            email: 'existing@test.local',
            password: 'Existing@P4ss',
            role: 'USER',
        });
    });

    beforeEach(() => {
        validPayload = {
            email: 'newuser@test.local',
            password: 'NewP@ss1234',
            passwordConfirm: 'NewP@ss1234',
            role: 'USER',
        };
    });

    afterAll(async () => {
        await User.destroy({
            where: { email: ['existing@test.local', 'newuser@test.local'] },
        });
    });

    describe('Validation', () => {

        it('should return 400 if email is not a valid format', async () => {
            validPayload.email = 'not-an-email';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Error occurred during registration.');
            expect(res.body.data).toHaveProperty('email', 'Valid email address is required.');
        });

        it('should return 400 if email is already registered', async () => {
            validPayload.email = 'existing@test.local';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty(
                'email',
                'existing@test.local is already in use. Please choose a different email.'
            );
        });

        it('should return 400 if role is missing', async () => {
            delete validPayload.role;
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('role', 'Role is required.');
        });

        it('should return 400 if role is not one of the allowed values', async () => {
            validPayload.role = 'SUPERADMIN';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty(
                'role',
                'Please select a valid role from: ADMIN, USER, VENUE, PERFORMER.'
            );
        });

        it('should return 400 if role is missing', async () => {
            delete validPayload.role;
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('role', 'Role is required.');
        });

        it('should return 400 if role is not one of the allowed values', async () => {
            validPayload.role = 'SUPERADMIN';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty(
                'role',
                'Please select a valid role from: ADMIN, USER, VENUE, PERFORMER.'
            );
        });

        it('should return 400 if password is missing', async () => {
            delete validPayload.password;
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('password', 'Password is required.');
        });

        it('should return 400 if password is fewer than 6 characters', async () => {
            validPayload.password = 'Ab!1';
            validPayload.passwordConfirm = 'Ab!1';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('password', 'Password must be at least 6 characters long.');
        });

        it('should return 400 if password exceeds 25 characters', async () => {
            validPayload.password = 'LongP@ss12345678901234567';  // 25 chars → adjust to 26
            validPayload.password = 'LongP@ss123456789012345678'; // 26 chars
            validPayload.passwordConfirm = validPayload.password;
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('password', 'Password cannot exceed 25 characters.');
        });

        it('should return 400 if password does not meet complexity requirements', async () => {
            validPayload.password = 'Password123';  // no special character
            validPayload.passwordConfirm = 'Password123';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty(
                'password',
                'Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.'
            );
        });

        it('should return 400 if passwordConfirm is missing', async () => {
            delete validPayload.passwordConfirm;
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('passwordConfirm', 'Password confirmation is required.');
        });

        it('should return 400 if passwordConfirm does not match password', async () => {
            validPayload.passwordConfirm = 'DifferentP@ss1';
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(400);
            expect(res.body.data).toHaveProperty('passwordConfirm', 'Passwords do not match.');
        });
    });

    describe('Success', () => {
        it('should return 201 and the serialized user on a valid registration', async () => {
            const res = await request(app)
                .post('/v1/auth/basic-registration')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toBe('New user account created successfully.');

            const data = res.body.data;

            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('email', 'newuser@test.local');
            expect(data).toHaveProperty('role', 'USER');
            expect(data).toHaveProperty('createdAt');
            expect(data).toHaveProperty('updatedAt');

            // Sensitive fields must not be exposed
            expect(data).not.toHaveProperty('password');
            expect(data).not.toHaveProperty('googleSub');
            expect(data).not.toHaveProperty('passwordConfirm');
        });
    });

    describe('Error propagation', () => {
        it('should call next() with an error if the controller throws', async () => {
            const req = {};   // req.body is undefined → destructuring throws
            const res = {};
            const next = jest.fn();
            await basicRegistrationController(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});