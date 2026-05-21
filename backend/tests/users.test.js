'use strict';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const app = require('../server');

const makeToken = (payload) => jwt.sign(payload, 'test-secret', { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());


describe('GET /api/users/me', () => {
    const token = makeToken({ user_id: 1, username: 'TestUser', role: 'user' });

    it('renvoie le profil de l\'utilisateur connecté', async () => {
        db.query
            .mockResolvedValueOnce([[{ is_active: 1 }]])
            .mockResolvedValueOnce([[{
                user_id: 1, username: 'TestUser', email: 'test@example.com',
                avatar_url: null, role: 'user', created_at: '2026-01-01', last_login: null,
            }]]);

        const res = await request(app).get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('TestUser');
        expect(res.body.email).toBe('test@example.com');
    });

    it('refuse sans token', async () => {
        const res = await request(app).get('/api/users/me');
        expect(res.status).toBe(401);
    });
});


describe('PUT /api/users/me', () => {
    const token = makeToken({ user_id: 1, username: 'TestUser', role: 'user' });

    it('met à jour le profil avec des données valides', async () => {
        db.query
            .mockResolvedValueOnce([[{ is_active: 1 }]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{
                user_id: 1, username: 'NouveauNom', email: 'nouveau@example.com',
                avatar_url: null, role: 'user', created_at: '2026-01-01',
            }]]);

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'NouveauNom', email: 'nouveau@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('NouveauNom');
    });

    it("refuse si le nom d'utilisateur ou l'email est déjà utilisé", async () => {
        db.query
            .mockResolvedValueOnce([[{ is_active: 1 }]])
            .mockResolvedValueOnce([[{ user_id: 99 }]]);

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'AutreUser', email: 'autre@example.com' });

        expect(res.status).toBe(409);
    });

    it("refuse un nom d'utilisateur trop court", async () => {
        db.query.mockResolvedValueOnce([[{ is_active: 1 }]]);

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'ab', email: 'test@example.com' });

        expect(res.status).toBe(400);
    });

    it('refuse un email invalide', async () => {
        db.query.mockResolvedValueOnce([[{ is_active: 1 }]]);

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'TestUser', email: 'pas-un-email' });

        expect(res.status).toBe(400);
    });

    it('refuse sans token', async () => {
        const res = await request(app).put('/api/users/me')
            .send({ username: 'TestUser', email: 'test@example.com' });

        expect(res.status).toBe(401);
    });
});
