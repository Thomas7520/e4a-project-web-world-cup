// routes/leagues.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto'); 

const db = require('../config/db'); 
const requireAuth = require('../middlewares/requireAuth'); 

const getUserId = (req) => req.user?.user_id || req.user?.id;

/**
 * 1. POST /leagues - Créer une ligue privée
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        let owner_id = getUserId(req);

        if (!owner_id) {
            const [u] = await db.query("SELECT user_id FROM users WHERE username = 'Reda' LIMIT 1");
            owner_id = u[0]?.user_id || 1;
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: "Le nom de la ligue est obligatoire." });
        }

        const invite_code = crypto.randomBytes(4).toString('hex').toUpperCase();

        const [result] = await db.query(
            'INSERT INTO leagues (name, owner_id, invite_code) VALUES (?, ?, ?)', 
            [name.trim(), owner_id, invite_code]
        );
        const league_id = result.insertId;

        await db.query(
            'INSERT INTO league_members (league_id, user_id) VALUES (?, ?)', 
            [league_id, owner_id]
        );

        res.status(201).json({
            message: "Ligue privée créée avec succès !",
            league: {
                id: league_id,
                name,
                invite_code
            }
        });

    } catch (error) {
        console.error("Erreur lors de la création de la ligue :", error);
        res.status(500).json({ error: "Erreur lors de la création de la ligue." });
    }
});

/**
 * 2. POST /leagues/join - Rejoindre une ligue via son code
 */
router.post('/join', requireAuth, async (req, res) => {
    try {
        const { invite_code } = req.body;
        let user_id = getUserId(req);

        if (!user_id) {
            const [u] = await db.query("SELECT user_id FROM users WHERE username = 'Reda' LIMIT 1");
            user_id = u[0]?.user_id || 1;
        }

        if (!invite_code) {
            return res.status(400).json({ error: "Le code d'invitation est obligatoire." });
        }

        const [leagues] = await db.query('SELECT league_id, name FROM leagues WHERE invite_code = ?', [invite_code.trim().toUpperCase()]);

        if (leagues.length === 0) {
            return res.status(404).json({ error: "Ligue introuvable. Vérifie le code d'invitation." });
        }

        const league = leagues[0];

        const [members] = await db.query('SELECT * FROM league_members WHERE league_id = ? AND user_id = ?', [league.league_id, user_id]);

        if (members.length > 0) {
            return res.status(400).json({ error: "Tu fais déjà partie de cette ligue !" });
        }

        await db.query('INSERT INTO league_members (league_id, user_id) VALUES (?, ?)', [league.league_id, user_id]);

        res.status(200).json({
            message: `Tu as rejoint la ligue "${league.name}" avec succès !`,
            league_id: league.league_id
        });

    } catch (error) {
        console.error("Erreur lors de l'adhésion à la ligue :", error);
        res.status(500).json({ error: "Erreur lors de la tentative de rejoindre la ligue." });
    }
});

/**
 * 3. GET /leagues/me - Récupérer la liste des ligues de l'utilisateur
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        let user_id = getUserId(req);

        if (!user_id) {
            const [u] = await db.query("SELECT user_id FROM users WHERE username = 'Reda' LIMIT 1");
            user_id = u[0]?.user_id || 1;
        }

        const query = `
            SELECT l.league_id, l.name, l.invite_code, l.created_at,
                   (SELECT COUNT(*) FROM league_members lm2 WHERE lm2.league_id = l.league_id) as member_count
            FROM leagues l
            JOIN league_members lm ON l.league_id = lm.league_id
            WHERE lm.user_id = ?
            ORDER BY l.created_at DESC
        `;
        const [myLeagues] = await db.query(query, [user_id]);

        res.status(200).json(myLeagues);

    } catch (error) {
        console.error("Erreur lors de la récupération de tes ligues :", error);
        res.status(500).json({ error: "Erreur lors de la récupération de tes ligues." });
    }
});

/**
 * 4. GET /leagues/:id - Récupérer les détails d'une ligue avec classement
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const league_id = req.params.id;
        let user_id = getUserId(req);

        if (!user_id) {
            const [u] = await db.query("SELECT user_id FROM users WHERE username = 'Reda' LIMIT 1");
            user_id = u[0]?.user_id || 1;
        }

        const checkAccessQuery = `
            SELECT l.*, u.username as owner_name 
            FROM leagues l
            JOIN users u ON l.owner_id = u.user_id
            JOIN league_members lm ON l.league_id = lm.league_id
            WHERE l.league_id = ? AND lm.user_id = ?
        `;
        const [leagues] = await db.query(checkAccessQuery, [league_id, user_id]);

        if (leagues.length === 0) {
            return res.status(403).json({ error: "Ligue introuvable ou tu n'as pas l'autorisation d'y accéder." });
        }

        const leagueDetails = leagues[0];

        const leaderboardQuery = `
            SELECT 
                u.user_id,
                u.username,
                u.avatar_url,
                IFNULL(SUM(p.points_earned), 0) as total_points,
                COUNT(p.prediction_id) as predictions_count,
                COUNT(CASE WHEN p.points_earned = 5 THEN 1 END) as exact_scores_count
            FROM league_members lm
            JOIN users u ON lm.user_id = u.user_id
            LEFT JOIN predictions p ON u.user_id = p.user_id
            WHERE lm.league_id = ?
            GROUP BY u.user_id, u.username, u.avatar_url
            ORDER BY total_points DESC, exact_scores_count DESC, u.username ASC
        `;
        const [leaderboard] = await db.query(leaderboardQuery, [league_id]);

        res.status(200).json({
            league: {
                id: leagueDetails.league_id,
                name: leagueDetails.name,
                invite_code: leagueDetails.invite_code,
                owner_id: leagueDetails.owner_id,
                owner_name: leagueDetails.owner_name,
                created_at: leagueDetails.created_at
            },
            leaderboard: leaderboard
        });

    } catch (error) {
        console.error("Erreur lors de la récupération du classement :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des détails de la ligue." });
    }
});

module.exports = router;