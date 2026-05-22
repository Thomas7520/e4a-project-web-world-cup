const db = require('../config/db');

const getPlayerById = async (req, res) => {
    const { id } = req.params;

    try {
        const [players] = await db.query(
            `SELECT
                p.player_id,
                p.full_name,
                p.position,
                p.shirt_number,
                p.club,
                t.team_id,
                t.name AS team_name,
                t.fifa_code AS team_code,
                t.flag_url AS team_flag_url
             FROM players p
             JOIN teams t ON t.team_id = p.team_id
             WHERE p.player_id = ?`,
            [id]
        );

        if (players.length === 0) {
            return res.status(404).json({ message: 'Joueur introuvable' });
        }

        res.json({ player: players[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getPlayerById };
