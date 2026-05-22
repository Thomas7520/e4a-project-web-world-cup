const db = require('../config/db');

const baseMatchSelect = `
    SELECT
        m.match_id,
        m.match_number,
        m.stage,
        m.status,
        m.kickoff_at,
        m.home_score,
        m.away_score,
        c.competition_id,
        c.name AS competition_name,
        gp.group_id,
        gp.name AS group_name,
        home.team_id AS home_team_id,
        home.name AS home_team_name,
        home.fifa_code AS home_team_code,
        home.flag_url AS home_flag_url,
        away.team_id AS away_team_id,
        away.name AS away_team_name,
        away.fifa_code AS away_team_code,
        away.flag_url AS away_flag_url,
        s.stadium_id,
        s.name AS stadium_name,
        s.city AS stadium_city,
        s.country AS stadium_country,
        s.capacity AS stadium_capacity
    FROM matches m
    JOIN competitions c ON c.competition_id = m.competition_id
    JOIN teams home ON home.team_id = m.home_team_id
    JOIN teams away ON away.team_id = m.away_team_id
    LEFT JOIN groups_pool gp ON gp.group_id = m.group_id
    LEFT JOIN stadiums s ON s.stadium_id = m.stadium_id
`;

const getMatches = async (req, res) => {
    const { date, team, team_id, stage, status } = req.query;
    const where = [];
    const params = [];

    if (date) {
        where.push('DATE(m.kickoff_at) = ?');
        params.push(date);
    }

    if (stage) {
        where.push('m.stage = ?');
        params.push(stage);
    }

    if (status) {
        where.push('m.status = ?');
        params.push(status);
    }

    const selectedTeam = team_id || team;
    if (selectedTeam) {
        if (/^\d+$/.test(String(selectedTeam))) {
            where.push('(m.home_team_id = ? OR m.away_team_id = ?)');
            params.push(selectedTeam, selectedTeam);
        } else {
            where.push('(home.name LIKE ? OR away.name LIKE ? OR home.fifa_code = ? OR away.fifa_code = ?)');
            params.push(
                `%${selectedTeam}%`,
                `%${selectedTeam}%`,
                String(selectedTeam).toUpperCase(),
                String(selectedTeam).toUpperCase()
            );
        }
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    try {
        const [matches] = await db.query(
            `${baseMatchSelect}
             ${whereClause}
             ORDER BY m.kickoff_at, m.match_number`,
            params
        );

        res.json({ matches });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getMatchById = async (req, res) => {
    const { id } = req.params;

    try {
        const [matches] = await db.query(
            `${baseMatchSelect}
             WHERE m.match_id = ?`,
            [id]
        );

        if (matches.length === 0) {
            return res.status(404).json({ message: 'Match introuvable' });
        }

        const [events] = await db.query(
            `SELECT
                e.event_id,
                e.minute,
                e.event_type,
                e.description,
                t.team_id,
                t.name AS team_name,
                p.player_id,
                p.full_name AS player_name
             FROM events e
             JOIN teams t ON t.team_id = e.team_id
             LEFT JOIN players p ON p.player_id = e.player_id
             WHERE e.match_id = ?
             ORDER BY e.minute, e.event_id`,
            [id]
        );

        const [referees] = await db.query(
            `SELECT
                r.referee_id,
                r.full_name,
                r.nationality,
                mr.role
             FROM match_referees mr
             JOIN referees r ON r.referee_id = mr.referee_id
             WHERE mr.match_id = ?
             ORDER BY FIELD(mr.role, 'main', 'assistant', 'fourth', 'var'), r.full_name`,
            [id]
        );

        res.json({ match: matches[0], events, referees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getMatches, getMatchById };
