'use strict';

jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');
const standingsService = require('../src/services/standingsService');

beforeEach(() => jest.clearAllMocks());

describe('standingsService.recalculateGroupStandings', () => {
    it('recalculates every team in the group before updating positions', async () => {
        db.query
            .mockResolvedValueOnce([[{ team_id: 10 }, { team_id: 20 }]])
            .mockResolvedValueOnce([[{ match_id: 1, home_team_id: 10, away_team_id: 20, home_score: 2, away_score: 1 }]])
            .mockResolvedValueOnce([[{ standing_id: 1 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ match_id: 1, home_team_id: 10, away_team_id: 20, home_score: 2, away_score: 1 }]])
            .mockResolvedValueOnce([[{ standing_id: 2 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ standing_id: 1 }, { standing_id: 2 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}]);

        await standingsService.recalculateGroupStandings(2, 7);

        expect(db.query.mock.calls[0][0]).toContain('ORDER BY team_id ASC');
        expect(db.query.mock.calls[0][1]).toEqual([7, 2]);

        const teamStatsQueries = db.query.mock.calls.filter(([sql]) => sql.includes('FROM matches m'));
        expect(teamStatsQueries.map(([, params]) => params)).toEqual([
            [2, 7, 10, 10],
            [2, 7, 20, 20],
        ]);

        const positionUpdates = db.query.mock.calls.filter(([sql]) => sql.includes('UPDATE standings SET position'));
        expect(positionUpdates.map(([, params]) => params)).toEqual([
            [1, 1],
            [2, 2],
        ]);
    });
});

describe('standingsService.initializeGroupStandings', () => {
    it('creates missing standings with one-based positions in team order', async () => {
        db.query
            .mockResolvedValueOnce([[{ team_id: 10 }, { team_id: 20 }, { team_id: 30 }]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ standing_id: 5 }]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([{}]);

        await standingsService.initializeGroupStandings(2, 7);

        expect(db.query.mock.calls[0][0]).toContain('ORDER BY team_id ASC');
        expect(db.query.mock.calls[0][1]).toEqual([7, 2]);

        const insertCalls = db.query.mock.calls.filter(([sql]) => sql.includes('INSERT INTO standings'));
        expect(insertCalls).toHaveLength(2);
        expect(insertCalls[0][1]).toEqual([2, 7, 10, 1]);
        expect(insertCalls[1][1]).toEqual([2, 7, 30, 3]);
    });
});

describe('standingsService.calculateTeamStats', () => {
    it('updates an existing standing with recalculated totals', async () => {
        db.query
            .mockResolvedValueOnce([[
                { match_id: 1, home_team_id: 10, away_team_id: 20, home_score: 2, away_score: 1 },
                { match_id: 2, home_team_id: 30, away_team_id: 10, home_score: 0, away_score: 0 },
                { match_id: 3, home_team_id: 10, away_team_id: 40, home_score: 1, away_score: 3 },
            ]])
            .mockResolvedValueOnce([[{ standing_id: 99 }]])
            .mockResolvedValueOnce([{}]);

        await standingsService.calculateTeamStats(2, 7, 10);

        const updateCall = db.query.mock.calls.find(([sql]) => sql.includes('UPDATE standings SET'));
        expect(updateCall[1]).toEqual([
            3, // matches_played
            1, // wins
            1, // draws
            1, // losses
            3, // goals_for
            4, // goals_against
            -1, // goal_difference
            4, // points
            7,
            10,
        ]);
    });

    it('inserts a missing standing with a valid initial position', async () => {
        db.query
            .mockResolvedValueOnce([[
                { match_id: 1, home_team_id: 20, away_team_id: 10, home_score: 0, away_score: 2 },
            ]])
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([[{ next_position: 4 }]])
            .mockResolvedValueOnce([{}]);

        await standingsService.calculateTeamStats(2, 7, 10);

        const insertCall = db.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO standings'));
        expect(insertCall[1]).toEqual([
            2, // competition_id
            7, // group_id
            10, // team_id
            4, // position
            1, // matches_played
            1, // wins
            0, // draws
            0, // losses
            2, // goals_for
            0, // goals_against
            2, // goal_difference
            3, // points
        ]);
    });
});

describe('standingsService.updateGroupPositions', () => {
    it('assigns positions according to the sorted standings query', async () => {
        db.query
            .mockResolvedValueOnce([[{ standing_id: 21 }, { standing_id: 22 }, { standing_id: 23 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([{}]);

        await standingsService.updateGroupPositions(7);

        expect(db.query.mock.calls[0][0]).toContain('ORDER BY points DESC, goal_difference DESC, goals_for DESC');

        const positionUpdates = db.query.mock.calls.filter(([sql]) => sql.includes('UPDATE standings SET position'));
        expect(positionUpdates.map(([, params]) => params)).toEqual([
            [1, 21],
            [2, 22],
            [3, 23],
        ]);
    });
});
