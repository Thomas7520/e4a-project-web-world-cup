const db = require('../config/db');

const getGroups = async (req, res) => {
    const { competition_id } = req.query;
    const params = [];
    const whereClause = competition_id ? 'WHERE gp.competition_id = ?' : '';

    if (competition_id) {
        params.push(competition_id);
    }

    try {
        const [rows] = await db.query(
            `SELECT
                gp.group_id,
                gp.competition_id,
                gp.name AS group_name,
                t.team_id,
                t.name AS team_name,
                t.fifa_code,
                t.iso_code,
                t.confederation,
                t.coach,
                t.flag_url
             FROM groups_pool gp
             LEFT JOIN teams t ON t.group_id = gp.group_id
             ${whereClause}
             ORDER BY gp.name, t.name`,
            params
        );

        const groups = Array.from(rows.reduce((map, row) => {
            if (!map.has(row.group_id)) {
                map.set(row.group_id, {
                    group_id: row.group_id,
                    competition_id: row.competition_id,
                    name: row.group_name,
                    teams: [],
                });
            }

            if (row.team_id) {
                map.get(row.group_id).teams.push({
                    team_id: row.team_id,
                    name: row.team_name,
                    fifa_code: row.fifa_code,
                    iso_code: row.iso_code,
                    confederation: row.confederation,
                    coach: row.coach,
                    flag_url: row.flag_url,
                });
            }

            return map;
        }, new Map()).values());

        res.json({ groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getGroups };
