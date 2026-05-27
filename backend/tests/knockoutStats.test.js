'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const app = require('../server');

beforeEach(() => jest.clearAllMocks());

describe('Knockout API', () => {
    it('returns the full knockout bracket when competition exists', async () => {
        db.query
            .mockResolvedValueOnce([[{ competition_id: 1, name: 'World Cup', year: 2026 }]])
            .mockResolvedValueOnce([[{ knockout_id: 1, position: 1, home_team_name: 'Team A', away_team_name: 'Team B', home_score: 2, away_score: 1, status: 'finished' }]])
            .mockResolvedValueOnce([[{ knockout_id: 2, position: 1, home_team_name: 'Team C', away_team_name: 'Team D', home_score: 1, away_score: 3, status: 'finished' }]])
            .mockResolvedValueOnce([[{ knockout_id: 3, position: 1, home_team_name: 'Team E', away_team_name: 'Team F', home_score: null, away_score: null, status: 'scheduled' }]])
            .mockResolvedValueOnce([[{ knockout_id: 4, position: 1, home_team_name: 'Team G', away_team_name: 'Team H', home_score: null, away_score: null, status: 'scheduled' }]])
            .mockResolvedValueOnce([[{ knockout_id: 5, position: 1, home_team_name: null, away_team_name: null, home_score: null, away_score: null, status: 'scheduled' }]])
            .mockResolvedValueOnce([[{ knockout_id: 6, position: 1, home_team_name: null, away_team_name: null, home_score: null, away_score: null, status: 'scheduled' }]]);

        const res = await request(app).get('/api/knockout/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.competition.name).toBe('World Cup');
        expect(res.body.bracket.round_of_32).toHaveLength(1);
        expect(res.body.bracket.round_of_16).toHaveLength(1);
        expect(res.body.bracket.quarter_final).toHaveLength(1);
        expect(res.body.bracket.semi_final).toHaveLength(1);
        expect(res.body.bracket.third_place).toHaveLength(1);
        expect(res.body.bracket.final).toHaveLength(1);
    });

    it('returns 404 when the competition does not exist', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/knockout/999');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

describe('Stats API', () => {
    it('returns competition statistics including scorers, assists, cards and team stats', async () => {
        db.query
            .mockResolvedValueOnce([[{ competition_id: 1, name: 'World Cup', year: 2026 }]])
            .mockResolvedValueOnce([[{ player_id: 1, full_name: 'Player A', goals: 5 }]])
            .mockResolvedValueOnce([[{ player_id: 2, full_name: 'Player B', assists: 4 }]])
            .mockResolvedValueOnce([[{ player_id: 3, full_name: 'Player C', yellow_cards: 2 }]])
            .mockResolvedValueOnce([[{ player_id: 4, full_name: 'Player D', red_cards: 1 }]])
            .mockResolvedValueOnce([[{ team_id: 1, name: 'Team A', total_goals: 10, total_assists: 7, total_yellow_cards: 3, total_red_cards: 1 }]]);

        const res = await request(app).get('/api/stats/competition/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.stats.top_scorers).toHaveLength(1);
        expect(res.body.stats.top_assists).toHaveLength(1);
        expect(res.body.stats.cards.yellow_cards).toHaveLength(1);
        expect(res.body.stats.cards.red_cards).toHaveLength(1);
        expect(res.body.stats.team_stats).toHaveLength(1);
    });

    it('returns 404 when the competition is not found', async () => {
        db.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/api/stats/competition/999');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
