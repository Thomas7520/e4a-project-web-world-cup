const db = require('../config/db');

const matchSelect = `
    SELECT
        m.match_id,
        m.match_number,
        m.stage,
        m.status,
        m.kickoff_at,
        m.home_score,
        m.away_score,
        home.team_id AS home_team_id,
        home.name AS home_team_name,
        home.fifa_code AS home_team_code,
        home.flag_url AS home_flag_url,
        away.team_id AS away_team_id,
        away.name AS away_team_name,
        away.fifa_code AS away_team_code,
        away.flag_url AS away_flag_url,
        s.name AS stadium_name,
        s.city AS stadium_city,
        s.country AS stadium_country,
        gp.name AS group_name
    FROM matches m
    JOIN teams home ON home.team_id = m.home_team_id
    JOIN teams away ON away.team_id = m.away_team_id
    LEFT JOIN stadiums s ON s.stadium_id = m.stadium_id
    LEFT JOIN groups_pool gp ON gp.group_id = m.group_id
`;

const getTeams = async (req, res) => {
    const { competition_id, group_id, search } = req.query;
    const where = [];
    const params = [];

    if (competition_id) {
        where.push('t.competition_id = ?');
        params.push(competition_id);
    }

    if (group_id) {
        where.push('t.group_id = ?');
        params.push(group_id);
    }

    if (search) {
        where.push('(t.name LIKE ? OR t.fifa_code LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    try {
        const [teams] = await db.query(
            `SELECT
                t.team_id,
                t.name,
                t.fifa_code,
                t.iso_code,
                t.confederation,
                t.coach,
                t.flag_url,
                gp.group_id,
                gp.name AS group_name
             FROM teams t
             LEFT JOIN groups_pool gp ON gp.group_id = t.group_id
             ${whereClause}
             ORDER BY gp.name, t.name`,
            params
        );

        res.json({ teams });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getTeamById = async (req, res) => {
    const { id } = req.params;

    try {
        const [teams] = await db.query(
            `SELECT
                t.team_id,
                t.name,
                t.fifa_code,
                t.iso_code,
                t.confederation,
                t.coach,
                t.flag_url,
                gp.group_id,
                gp.name AS group_name
             FROM teams t
             LEFT JOIN groups_pool gp ON gp.group_id = t.group_id
             WHERE t.team_id = ?`,
            [id]
        );

        if (teams.length === 0) {
            return res.status(404).json({ message: 'Equipe introuvable' });
        }

        const [players] = await db.query(
            `SELECT player_id, full_name, position, shirt_number, club
             FROM players
             WHERE team_id = ?
             ORDER BY shirt_number IS NULL, shirt_number, full_name`,
            [id]
        );

        const [matches] = await db.query(
            `${matchSelect}
             WHERE m.home_team_id = ? OR m.away_team_id = ?
             ORDER BY m.kickoff_at`,
            [id, id]
        );

        res.json({ team: teams[0], players, matches });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getTeams, getTeamById };
