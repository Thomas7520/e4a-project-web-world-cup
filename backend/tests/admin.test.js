'use strict';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('../src/services/standingsService', () => ({ recalculateGroupStandings: jest.fn() }));
jest.mock('../src/services/knockoutService', () => ({ updateBracketAfterMatch: jest.fn() }));

const db = require('../src/config/db');
const app = require('../server');

const makeToken = (payload) => jwt.sign(payload, 'test-secret', { expiresIn: '1h' });

const tokens = {
    user:        makeToken({ user_id: 10, username: 'UserNormal',  role: 'user'        }),
    moderator:   makeToken({ user_id: 20, username: 'Moderateur',  role: 'moderator'   }),
    admin:       makeToken({ user_id: 30, username: 'Admin',       role: 'admin'       }),
    super_admin: makeToken({ user_id: 40, username: 'SuperAdmin',  role: 'super_admin' }),
};

const authOk = () => db.query.mockResolvedValueOnce([[{ is_active: 1 }]]);

beforeEach(() => jest.clearAllMocks());

describe('GET /api/admin/users', () => {
    const mockCount = [[{ total: 1 }]];
    const mockUsers = [[{ user_id: 1, username: 'Alice', email: 'a@a.com', role: 'user', is_active: 1 }]];

    it('autorise un modérateur à lister les utilisateurs', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce(mockCount)
            .mockResolvedValueOnce(mockUsers);

        const res = await request(app).get('/api/admin/users')
            .set('Authorization', `Bearer ${tokens.moderator}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body.total).toBe(1);
    });

    it('autorise un admin à lister les utilisateurs', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce(mockCount)
            .mockResolvedValueOnce(mockUsers);

        const res = await request(app).get('/api/admin/users')
            .set('Authorization', `Bearer ${tokens.admin}`);

        expect(res.status).toBe(200);
    });

    it('refuse un utilisateur normal (403)', async () => {
        authOk();

        const res = await request(app).get('/api/admin/users')
            .set('Authorization', `Bearer ${tokens.user}`);

        expect(res.status).toBe(403);
    });

    it('refuse sans token (401)', async () => {
        const res = await request(app).get('/api/admin/users');
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/admin/users/:id/disable', () => {
    it('un modérateur peut désactiver un utilisateur normal', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[{ user_id: 99, role: 'user', is_active: 1 }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).put('/api/admin/users/99/disable')
            .set('Authorization', `Bearer ${tokens.moderator}`);

        expect(res.status).toBe(200);
    });

    it('un modérateur ne peut pas désactiver un admin (403)', async () => {
        authOk();
        db.query.mockResolvedValueOnce([[{ user_id: 30, role: 'admin', is_active: 1 }]]);

        const res = await request(app).put('/api/admin/users/30/disable')
            .set('Authorization', `Bearer ${tokens.moderator}`);

        expect(res.status).toBe(403);
    });

    it('refuse un utilisateur normal (403)', async () => {
        authOk();

        const res = await request(app).put('/api/admin/users/99/disable')
            .set('Authorization', `Bearer ${tokens.user}`);

        expect(res.status).toBe(403);
    });

    it("renvoie 404 si l'utilisateur cible est introuvable", async () => {
        authOk();
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).put('/api/admin/users/9999/disable')
            .set('Authorization', `Bearer ${tokens.moderator}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/admin/users/:id/promote', () => {
    it('un admin peut promouvoir un utilisateur en modérateur', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[{ user_id: 99, role: 'user' }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).put('/api/admin/users/99/promote')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ role: 'moderator' });

        expect(res.status).toBe(200);
    });

    it("refuse d'attribuer le rôle super_admin (rôle invalide)", async () => {
        authOk();

        const res = await request(app).put('/api/admin/users/99/promote')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ role: 'super_admin' });

        expect(res.status).toBe(400);
    });

    it("un admin ne peut pas promouvoir un autre admin au rang admin (rang égal)", async () => {
        authOk();
        db.query.mockResolvedValueOnce([[{ user_id: 99, role: 'admin' }]]);

        const res = await request(app).put('/api/admin/users/99/promote')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ role: 'admin' });

        expect(res.status).toBe(403);
    });

    it('un modérateur ne peut pas changer les rôles (403)', async () => {
        authOk();

        const res = await request(app).put('/api/admin/users/99/promote')
            .set('Authorization', `Bearer ${tokens.moderator}`)
            .send({ role: 'user' });

        expect(res.status).toBe(403);
    });

    it('refuse sans token (401)', async () => {
        const res = await request(app).put('/api/admin/users/99/promote')
            .send({ role: 'moderator' });

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/admin/users/:id', () => {
    it("un admin peut modifier le nom et l'email d'un utilisateur", async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).put('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ username: 'NouveauNom', email: 'nouveau@example.com' });

        expect(res.status).toBe(200);
    });

    it("refuse si le nom ou l'email est déjà utilisé (409)", async () => {
        authOk();
        db.query.mockResolvedValueOnce([[{ user_id: 5 }]]);

        const res = await request(app).put('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ username: 'Existant', email: 'existant@example.com' });

        expect(res.status).toBe(409);
    });

    it('un modérateur ne peut pas modifier les infos (403)', async () => {
        authOk();

        const res = await request(app).put('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.moderator}`)
            .send({ username: 'Test', email: 'test@example.com' });

        expect(res.status).toBe(403);
    });
});

describe('DELETE /api/admin/users/:id', () => {
    it('un super_admin peut supprimer un utilisateur normal', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([[{ user_id: 99, role: 'user' }]])
            .mockResolvedValueOnce([{}]);

        const res = await request(app).delete('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.super_admin}`);

        expect(res.status).toBe(200);
    });

    it('refuse de supprimer un super_admin (403)', async () => {
        authOk();
        db.query.mockResolvedValueOnce([[{ user_id: 99, role: 'super_admin' }]]);

        const res = await request(app).delete('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.super_admin}`);

        expect(res.status).toBe(403);
    });

    it('refuse de supprimer son propre compte (400)', async () => {
        authOk();

        const res = await request(app).delete('/api/admin/users/40')
            .set('Authorization', `Bearer ${tokens.super_admin}`);

        expect(res.status).toBe(400);
    });

    it('un admin ne peut pas supprimer un utilisateur (403)', async () => {
        authOk();

        const res = await request(app).delete('/api/admin/users/99')
            .set('Authorization', `Bearer ${tokens.admin}`);

        expect(res.status).toBe(403);
    });

    it("renvoie 404 si l'utilisateur est introuvable", async () => {
        authOk();
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).delete('/api/admin/users/9999')
            .set('Authorization', `Bearer ${tokens.super_admin}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/admin/matches/:id/score', () => {
    it('un admin peut saisir le score d\'un match', async () => {
        authOk();
        db.query
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ match_id: 1, competition_id: 1, group_id: 1, stage: 'group', home_team_id: 1, away_team_id: 2 }]]);

        const res = await request(app).put('/api/admin/matches/1/score')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({ home_score: 2, away_score: 1 });

        expect(res.status).toBe(200);
    });

    it('refuse si les scores sont absents (400)', async () => {
        authOk();

        const res = await request(app).put('/api/admin/matches/1/score')
            .set('Authorization', `Bearer ${tokens.admin}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('un modérateur ne peut pas modifier les scores (403)', async () => {
        authOk();

        const res = await request(app).put('/api/admin/matches/1/score')
            .set('Authorization', `Bearer ${tokens.moderator}`)
            .send({ home_score: 2, away_score: 1 });

        expect(res.status).toBe(403);
    });
});
