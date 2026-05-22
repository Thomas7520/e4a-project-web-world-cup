'use strict';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

describe('Routes publiques Personne 2 - competitions', () => {
    it('liste les competitions', async () => {
        db.query.mockResolvedValueOnce([[{
            competition_id: 1,
            name: 'FIFA World Cup 2026',
            year: 2026,
            groups_count: 12,
            teams_count: 48,
            matches_count: 72,
        }]]);

        const res = await request(app).get('/api/competitions');

        expect(res.status).toBe(200);
        expect(res.body.competitions).toHaveLength(1);
        expect(res.body.competitions[0].teams_count).toBe(48);
    });

    it('renvoie une competition avec ses groupes', async () => {
        db.query
            .mockResolvedValueOnce([[{ competition_id: 1, name: 'FIFA World Cup 2026', year: 2026 }]])
            .mockResolvedValueOnce([[{ group_id: 1, name: 'A' }]]);

        const res = await request(app).get('/api/competitions/1');

        expect(res.status).toBe(200);
        expect(res.body.competition.name).toBe('FIFA World Cup 2026');
        expect(res.body.groups[0].name).toBe('A');
    });

    it('renvoie 404 si la competition est introuvable', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/competitions/999');

        expect(res.status).toBe(404);
    });
});

describe('Routes publiques Personne 2 - teams et players', () => {
    it('liste les equipes', async () => {
        db.query.mockResolvedValueOnce([[{
            team_id: 1,
            name: 'Mexico',
            fifa_code: 'MEX',
            group_name: 'A',
        }]]);

        const res = await request(app).get('/api/teams?search=mex');

        expect(res.status).toBe(200);
        expect(res.body.teams[0].fifa_code).toBe('MEX');
    });

    it('renvoie le detail equipe avec joueurs et matchs', async () => {
        db.query
            .mockResolvedValueOnce([[{ team_id: 1, name: 'Mexico', fifa_code: 'MEX', group_name: 'A' }]])
            .mockResolvedValueOnce([[{ player_id: 1, full_name: 'Santiago Gimenez', position: 'forward' }]])
            .mockResolvedValueOnce([[{ match_id: 1, home_team_name: 'Mexico', away_team_name: 'South Africa' }]]);

        const res = await request(app).get('/api/teams/1');

        expect(res.status).toBe(200);
        expect(res.body.team.name).toBe('Mexico');
        expect(res.body.players).toHaveLength(1);
        expect(res.body.matches).toHaveLength(1);
    });

    it('renvoie 404 si une equipe est introuvable', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/teams/999');

        expect(res.status).toBe(404);
    });

    it('renvoie le detail joueur', async () => {
        db.query.mockResolvedValueOnce([[{
            player_id: 1,
            full_name: 'Santiago Gimenez',
            team_name: 'Mexico',
        }]]);

        const res = await request(app).get('/api/players/1');

        expect(res.status).toBe(200);
        expect(res.body.player.team_name).toBe('Mexico');
    });

    it('renvoie 404 si un joueur est introuvable', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/players/999');

        expect(res.status).toBe(404);
    });
});

describe('Routes publiques Personne 2 - groupes', () => {
    it('regroupe les equipes par groupe', async () => {
        db.query.mockResolvedValueOnce([[
            { group_id: 1, competition_id: 1, group_name: 'A', team_id: 1, team_name: 'Mexico', fifa_code: 'MEX' },
            { group_id: 1, competition_id: 1, group_name: 'A', team_id: 2, team_name: 'South Africa', fifa_code: 'RSA' },
            { group_id: 2, competition_id: 1, group_name: 'B', team_id: 3, team_name: 'Canada', fifa_code: 'CAN' },
        ]]);

        const res = await request(app).get('/api/groups');

        expect(res.status).toBe(200);
        expect(res.body.groups).toHaveLength(2);
        expect(res.body.groups[0].teams).toHaveLength(2);
    });
});

describe('Routes publiques Personne 2 - matches', () => {
    it('liste les matchs avec filtres date, equipe, phase et statut', async () => {
        db.query.mockResolvedValueOnce([[{
            match_id: 1,
            home_team_name: 'Mexico',
            away_team_name: 'South Africa',
            stage: 'group',
            status: 'scheduled',
        }]]);

        const res = await request(app)
            .get('/api/matches')
            .query({ date: '2026-06-11', team: 'MEX', stage: 'group', status: 'scheduled' });

        expect(res.status).toBe(200);
        expect(res.body.matches).toHaveLength(1);
        expect(db.query.mock.calls[0][1]).toEqual([
            '2026-06-11',
            'group',
            'scheduled',
            '%MEX%',
            '%MEX%',
            'MEX',
            'MEX',
        ]);
    });

    it('filtre les matchs par identifiant equipe', async () => {
        db.query.mockResolvedValueOnce([[{ match_id: 1 }]]);

        const res = await request(app).get('/api/matches?team_id=12');

        expect(res.status).toBe(200);
        expect(db.query.mock.calls[0][1]).toEqual(['12', '12']);
    });

    it('renvoie le detail match avec events et arbitres', async () => {
        db.query
            .mockResolvedValueOnce([[{ match_id: 1, home_team_name: 'Mexico', away_team_name: 'South Africa' }]])
            .mockResolvedValueOnce([[{ event_id: 1, minute: 12, event_type: 'goal', team_name: 'Mexico' }]])
            .mockResolvedValueOnce([[{ referee_id: 1, full_name: 'Szymon Marciniak', role: 'main' }]]);

        const res = await request(app).get('/api/matches/1');

        expect(res.status).toBe(200);
        expect(res.body.match.home_team_name).toBe('Mexico');
        expect(res.body.events).toHaveLength(1);
        expect(res.body.referees).toHaveLength(1);
    });

    it('renvoie 404 si un match est introuvable', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/matches/999');

        expect(res.status).toBe(404);
    });
});

describe('Routes publiques Personne 2 - stades', () => {
    it('liste les stades', async () => {
        db.query.mockResolvedValueOnce([[{
            stadium_id: 1,
            name: 'Mexico City Stadium',
            city: 'Mexico City',
            matches_count: 5,
        }]]);

        const res = await request(app).get('/api/stadiums');

        expect(res.status).toBe(200);
        expect(res.body.stadiums[0].matches_count).toBe(5);
    });
});
