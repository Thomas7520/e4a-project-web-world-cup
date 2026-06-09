const express = require('express');
const router = express.Router();
const db = require('../config/db'); 
const requireAuth = require('../middlewares/requireAuth'); 
// 🔌 Importation de ton service de calcul validé par les tests
const { calculatePoints } = require('../services/predictionService');

const getUserId = (req) => req.user?.user_id || req.user?.id;

/**
 * POST /predictions - Enregistrer ou éditer un pronostic avec calcul des points
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { match_id, predicted_home_score, predicted_away_score } = req.body;
        const user_id = getUserId(req);

        if (match_id === undefined || predicted_home_score === undefined || predicted_away_score === undefined) {
            return res.status(400).json({ error: "Données manquantes." });
        }

        // 🔍 Récupération du score réel du match pour calculer les points si le match est fini
        const [matchRows] = await db.query(
            'SELECT home_score, away_score, status FROM matches WHERE match_id = ?',
            [match_id]
        );

        let points_earned = null;
        if (matchRows.length > 0) {
            const match = matchRows[0];
            if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
                points_earned = calculatePoints(
                    parseInt(predicted_home_score),
                    parseInt(predicted_away_score),
                    parseInt(match.home_score),
                    parseInt(match.away_score)
                );
            }
        }

        const query = `
            INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score, points_earned) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            predicted_home_score = VALUES(predicted_home_score), 
            predicted_away_score = VALUES(predicted_away_score),
            points_earned = VALUES(points_earned)
        `;
        
        await db.query(query, [user_id, match_id, predicted_home_score, predicted_away_score, points_earned]);
        res.status(201).json({ message: "Pronostic enregistré avec succès !" });

    } catch (error) {
        console.error("Erreur POST /predictions :", error);
        res.status(500).json({ error: "Erreur lors de l'enregistrement." });
    }
});

/**
 * GET /predictions/me - Historique réel avec calcul dynamique des points
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user_id = getUserId(req);

        const query = `
            SELECT p.prediction_id, p.match_id, p.points_earned,
                   p.predicted_home_score AS predicted_home, 
                   p.predicted_away_score AS predicted_away,
                   m.stage, m.kickoff_at, 
                   m.home_score AS actual_home, m.away_score AS actual_away,
                   t1.name AS home_team_name,
                   t2.name AS away_team_name
            FROM predictions p
            LEFT JOIN matches m ON p.match_id = m.match_id
            LEFT JOIN teams t1 ON m.home_team_id = t1.team_id
            LEFT JOIN teams t2 ON m.away_team_id = t2.team_id
            WHERE p.user_id = ?
            ORDER BY p.prediction_id DESC
        `;
        const [rows] = await db.query(query, [user_id]);

        // 🔄 Application de ton algorithme sur chaque ligne récupérée
        const processedRows = rows.map(row => {
            let points = row.points_earned;
            if (row.actual_home !== null && row.actual_away !== null) {
                points = calculatePoints(
                    parseInt(row.predicted_home),
                    parseInt(row.predicted_away),
                    parseInt(row.actual_home),
                    parseInt(row.actual_away)
                );
            }
            return {
                ...row,
                points_earned: points !== null ? points : 0
            };
        });

        res.json(processedRows);

    } catch (error) {
        console.error("Erreur GET /predictions/me :", error);
        res.status(500).json({ error: "Erreur lors de la récupération de l'historique." });
    }
});

module.exports = router;