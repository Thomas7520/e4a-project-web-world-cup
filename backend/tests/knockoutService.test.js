'use strict';

jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');
const knockoutService = require('../src/services/knockoutService');

const groupNames = 'ABCDEFGHIJKL'.split('');

const makeGroups = () => groupNames.map((name, index) => ({
    group_id: index + 1,
    name,
}));

const makeStandings = () => groupNames.flatMap((name, index) => [
    {
        team_id: 100 + index,
        position: 1,
        points: 7,
        goal_difference: 3,
        goals_for: 5,
        group_name: name,
    },
    {
        team_id: 200 + index,
        position: 2,
        points: 4,
        goal_difference: 1,
        goals_for: 4,
        group_name: name,
    },
    {
        team_id: 300 + index,
        position: 3,
        points: 12 - index,
        goal_difference: 2,
        goals_for: 3,
        group_name: name,
    },
]);

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('knockoutService.initializeKnockoutBracket', () => {
    it('builds a 32-team round of 32 from 12 group winners, runners-up and 8 best third-placed teams', async () => {
        db.query.mockImplementation(async (sql) => {
            if (sql.includes('SELECT knockout_id FROM knockout_matches')) {
                return [[]];
            }

            if (sql.includes('FROM groups_pool')) {
                return [makeGroups()];
            }

            if (sql.includes('FROM standings')) {
                return [makeStandings()];
            }

            return [{}];
        });

        await knockoutService.initializeKnockoutBracket(1);

        const insertCalls = db.query.mock.calls.filter(([sql]) => sql.includes('INSERT INTO knockout_matches'));
        const roundOf32Calls = insertCalls.filter(([, params]) => params[1] === 'round_of_32');
        const roundOf16Calls = insertCalls.filter(([, params]) => params[1] === 'round_of_16');
        const quarterCalls = insertCalls.filter(([, params]) => params[1] === 'quarter_final');
        const semiCalls = insertCalls.filter(([, params]) => params[1] === 'semi_final');

        expect(roundOf32Calls).toHaveLength(16);
        expect(roundOf16Calls).toHaveLength(8);
        expect(quarterCalls).toHaveLength(4);
        expect(semiCalls).toHaveLength(2);
        expect(insertCalls).toHaveLength(32);

        const firstRoundTeamIds = roundOf32Calls.flatMap(([, params]) => [params[3], params[4]]);
        const bestThirdIds = Array.from({ length: 8 }, (_, index) => 300 + index);
        const excludedThirdIds = [308, 309, 310, 311];

        expect(firstRoundTeamIds).toHaveLength(32);
        expect(new Set(firstRoundTeamIds).size).toBe(32);
        expect(bestThirdIds.every((teamId) => firstRoundTeamIds.includes(teamId))).toBe(true);
        expect(excludedThirdIds.some((teamId) => firstRoundTeamIds.includes(teamId))).toBe(false);
    });

    it('fails clearly when the standings do not contain enough third-placed teams', async () => {
        db.query.mockImplementation(async (sql) => {
            if (sql.includes('SELECT knockout_id FROM knockout_matches')) {
                return [[]];
            }

            if (sql.includes('FROM groups_pool')) {
                return [makeGroups()];
            }

            if (sql.includes('FROM standings')) {
                return [makeStandings().filter((standing) => standing.position !== 3)];
            }

            return [{}];
        });

        await expect(knockoutService.initializeKnockoutBracket(1))
            .rejects
            .toThrow('pas assez de troisièmes');
    });
});

describe('knockoutService.updateBracketAfterMatch', () => {
    it('uses the explicit winner to send the other semi-finalist to the third-place match', async () => {
        db.query
            .mockResolvedValueOnce([[{ knockout_id: 11, competition_id: 1, stage: 'semi_final', position: 2 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ knockout_id: 20 }]])
            .mockResolvedValueOnce([{}])
            .mockResolvedValueOnce([[{ home_team_id: 1, away_team_id: 2, home_score: 1, away_score: 1 }]])
            .mockResolvedValueOnce([[{ knockout_id: 30 }]])
            .mockResolvedValueOnce([{}]);

        await knockoutService.updateBracketAfterMatch(55, 2);

        const knockoutUpdates = db.query.mock.calls.filter(([sql]) => sql.includes('UPDATE knockout_matches SET'));
        expect(knockoutUpdates.map(([, params]) => params)).toEqual([
            [2, 11],
            [2, 20],
            [1, 30],
        ]);
    });
});
