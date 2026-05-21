'use strict';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/middlewares/upload', () => ({
    single: () => (req, res, next) => {
        req.file = { filename: 'avatar-1-123456.jpg' };
        next();
    },
}));

const db = require('../src/config/db');
const app = require('../server');

const makeToken = (payload) => jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
const token = makeToken({ user_id: 1, username: 'TestUser', role: 'user' });
const authOk = () => db.query.mockResolvedValueOnce([[{ is_active: 1 }]]);

beforeEach(() => jest.clearAllMocks());


describe('GET /api/users/me', () => {
    it('renvoie le profil de l\'utilisateur connecté', async () => {
        authOk();
        db.query.mockResolvedValueOnce([[{
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
    it('met à jour le profil avec des données valides', async () => {
        authOk();
        db.query
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
        authOk();
        db.query.mockResolvedValueOnce([[{ user_id: 99 }]]);

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'AutreUser', email: 'autre@example.com' });

        expect(res.status).toBe(409);
    });

    it("refuse un nom d'utilisateur trop court", async () => {
        authOk();

        const res = await request(app).put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'ab', email: 'test@example.com' });

        expect(res.status).toBe(400);
    });

    it('refuse un email invalide', async () => {
        authOk();

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


describe('PUT /api/users/me/password', () => {
    const bcrypt = require('bcrypt');

    it('change le mot de passe avec les bonnes données', async () => {
        const hash = await bcrypt.hash('AncienMdp1!', 10);
        authOk();
        db.query
            .mockResolvedValueOnce([[{ password_hash: hash }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).put('/api/users/me/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'AncienMdp1!', newPassword: 'NouveauMdp1!' });

        expect(res.status).toBe(200);
    });

    it('refuse si le mot de passe actuel est incorrect', async () => {
        const hash = await bcrypt.hash('AncienMdp1!', 10);
        authOk();
        db.query.mockResolvedValueOnce([[{ password_hash: hash }]]);

        const res = await request(app).put('/api/users/me/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'MauvaisMdp1!', newPassword: 'NouveauMdp1!' });

        expect(res.status).toBe(401);
    });

    it('refuse un nouveau mot de passe trop court', async () => {
        authOk();

        const res = await request(app).put('/api/users/me/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'AncienMdp1!', newPassword: 'court' });

        expect(res.status).toBe(400);
    });

    it('refuse un nouveau mot de passe sans majuscule', async () => {
        authOk();

        const res = await request(app).put('/api/users/me/password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'AncienMdp1!', newPassword: 'sansmajuscule1!' });

        expect(res.status).toBe(400);
    });

    it('refuse sans token', async () => {
        const res = await request(app).put('/api/users/me/password')
            .send({ currentPassword: 'AncienMdp1!', newPassword: 'NouveauMdp1!' });

        expect(res.status).toBe(401);
    });
});


describe('PUT /api/users/me/avatar', () => {
    it('upload un avatar avec succès', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[{ avatar_url: null }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).put('/api/users/me/avatar')
            .set('Authorization', `Bearer ${token}`)
            .attach('avatar', Buffer.from('fake-image'), 'avatar.jpg');

        expect(res.status).toBe(200);
        expect(res.body.avatar_url).toContain('/uploads/avatars/');
    });

    it('refuse sans token', async () => {
        const res = await request(app).put('/api/users/me/avatar');
        expect(res.status).toBe(401);
    });
});


describe('DELETE /api/users/me/avatar', () => {
    it('supprime l\'avatar avec succès', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[{ avatar_url: null }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).delete('/api/users/me/avatar')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it('refuse sans token', async () => {
        const res = await request(app).delete('/api/users/me/avatar');
        expect(res.status).toBe(401);
    });
});
