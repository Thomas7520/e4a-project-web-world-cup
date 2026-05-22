const db = require('../config/db');

const getCompetitions = async (req, res) => {
    try {
        const [competitions] = await db.query(`
            SELECT
                c.competition_id,
                c.name,
                c.year,
                c.host_countries,
                c.start_date,
                c.end_date,
                COUNT(DISTINCT gp.group_id) AS groups_count,
                COUNT(DISTINCT t.team_id) AS teams_count,
                COUNT(DISTINCT m.match_id) AS matches_count
            FROM competitions c
            LEFT JOIN groups_pool gp ON gp.competition_id = c.competition_id
            LEFT JOIN teams t ON t.competition_id = c.competition_id
            LEFT JOIN matches m ON m.competition_id = c.competition_id
            GROUP BY c.competition_id
            ORDER BY c.year DESC
        `);

        res.json({ competitions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getCompetitionById = async (req, res) => {
    const { id } = req.params;

    try {
        const [competitions] = await db.query(
            `SELECT competition_id, name, year, host_countries, start_date, end_date
             FROM competitions
             WHERE competition_id = ?`,
            [id]
        );

        if (competitions.length === 0) {
            return res.status(404).json({ message: 'Competition introuvable' });
        }

        const [groups] = await db.query(
            `SELECT group_id, name
             FROM groups_pool
             WHERE competition_id = ?
             ORDER BY name`,
            [id]
        );

        res.json({ competition: competitions[0], groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getCompetitions, getCompetitionById };
