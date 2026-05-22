const db = require('../config/db');

const getStadiums = async (req, res) => {
    try {
        const [stadiums] = await db.query(`
            SELECT
                s.stadium_id,
                s.name,
                s.city,
                s.country,
                s.capacity,
                COUNT(m.match_id) AS matches_count
            FROM stadiums s
            LEFT JOIN matches m ON m.stadium_id = s.stadium_id
            GROUP BY s.stadium_id
            ORDER BY s.country, s.city, s.name
        `);

        res.json({ stadiums });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getStadiums };
