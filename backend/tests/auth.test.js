'use strict';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
    it('crée un compte avec des données valides', async () => {
        db.query
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{ insertId: 1 }]);

        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'Password1!',
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Compte créé avec succès');
    });

    it("rejette si l'email ou le nom d'utilisateur est déjà pris", async () => {
        db.query.mockResolvedValueOnce([[{ user_id: 1 }]]);

        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'Password1!',
        });

        expect(res.status).toBe(409);
    });

    it('rejette un mot de passe sans majuscule', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'password1!',
        });
        expect(res.status).toBe(400);
    });

    it('rejette un mot de passe sans caractère spécial', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'Password1',
        });
        expect(res.status).toBe(400);
    });

    it('rejette un mot de passe trop court (moins de 8 caractères)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'test@example.com',
            password: 'Pa1!',
        });
        expect(res.status).toBe(400);
    });

    it('rejette un email invalide', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'TestUser',
            email: 'pas-un-email',
            password: 'Password1!',
        });
        expect(res.status).toBe(400);
    });

    it("rejette un nom d'utilisateur trop court (moins de 3 caractères)", async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password1!',
        });
        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    let hashedPassword;

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash('Password1!', 10);
    });

    it('connecte un utilisateur avec des identifiants valides', async () => {
        db.query
            .mockResolvedValueOnce([[{
                user_id: 1, username: 'TestUser', email: 'test@example.com',
                password_hash: hashedPassword, avatar_url: null, role: 'user', is_active: 1,
            }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'Password1!',
        });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.username).toBe('TestUser');
    });

    it("refuse si l'email est inconnu", async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).post('/api/auth/login').send({
            email: 'inconnu@example.com',
            password: 'Password1!',
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Email ou mot de passe incorrect');
    });

    it('refuse si le mot de passe est incorrect', async () => {
        db.query.mockResolvedValueOnce([[{
            user_id: 1, username: 'TestUser', email: 'test@example.com',
            password_hash: hashedPassword, avatar_url: null, role: 'user', is_active: 1,
        }]]);

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'MauvaisMotDePasse!',
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Email ou mot de passe incorrect');
    });

    it('refuse si le compte est désactivé', async () => {
        db.query.mockResolvedValueOnce([[{
            user_id: 2, username: 'BannedUser', email: 'banni@example.com',
            password_hash: hashedPassword, avatar_url: null, role: 'user', is_active: 0,
        }]]);

        const res = await request(app).post('/api/auth/login').send({
            email: 'banni@example.com',
            password: 'Password1!',
        });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Ce compte a été désactivé');
    });

    it('génère un token longue durée avec rememberMe', async () => {
        db.query
            .mockResolvedValueOnce([[{
                user_id: 1, username: 'TestUser', email: 'test@example.com',
                password_hash: hashedPassword, avatar_url: null, role: 'user', is_active: 1,
            }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'Password1!',
            rememberMe: true,
        });

        expect(res.status).toBe(200);
        const decoded = jwt.decode(res.body.token);
        expect(decoded.exp - decoded.iat).toBeGreaterThan(6 * 24 * 3600);
    });
});

describe('POST /api/auth/logout', () => {
    it('renvoie une confirmation de déconnexion', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Déconnexion réussie');
    });
});

describe('GET /api/auth/me', () => {
    const token = jwt.sign(
        { user_id: 1, username: 'TestUser', role: 'user' },
        'test-secret',
        { expiresIn: '1h' }
    );

    it('renvoie le profil de l\'utilisateur connecté', async () => {
        db.query
            .mockResolvedValueOnce([[{ is_active: 1 }]])
            .mockResolvedValueOnce([[{
                user_id: 1, username: 'TestUser', email: 'test@example.com',
                avatar_url: null, role: 'user', created_at: '2026-01-01', last_login: null,
            }]]);

        const res = await request(app).get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('TestUser');
    });

    it('refuse sans token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('refuse avec un token invalide', async () => {
        const res = await request(app).get('/api/auth/me')
            .set('Authorization', 'Bearer token.invalide.ici');
        expect(res.status).toBe(401);
    });

    it('refuse si le compte est désactivé', async () => {
        db.query.mockResolvedValueOnce([[{ is_active: 0 }]]);

        const res = await request(app).get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
    });
});
