const pool = require('../config/db');
const { calculatePoints } = require('../services/predictionService'); // 🔌 Import du service

const getUserId = (req) => req.user?.user_id || req.user?.id;

exports.getDashboardData = async (req, res) => {
  try {
    const user_id = getUserId(req);
    const username = req.user?.username;

    if (!user_id) {
      return res.status(401).json({ error: "Non autorisé. Veuillez vous connecter." });
    }

    // 1. Récupération de tous les pronostics et scores réels pour calculer la vraie somme globale
    const [preds] = await pool.query(`
      SELECT p.predicted_home_score, p.predicted_away_score, m.home_score, m.away_score
      FROM predictions p
      LEFT JOIN matches m ON p.match_id = m.match_id
      WHERE p.user_id = ?
    `, [user_id]);

    let totalPoints = 0;
    for (const p of preds) {
      if (p.home_score !== null && p.away_score !== null) {
        totalPoints += calculatePoints(
          parseInt(p.predicted_home_score),
          parseInt(p.predicted_away_score),
          parseInt(p.home_score),
          parseInt(p.away_score)
        );
      }
    }

    // 2. Nombre réel de lignes dans league_members
    const [leaguesRows] = await pool.query(
      'SELECT COUNT(*) AS activeLeagues FROM league_members WHERE user_id = ?',
      [user_id]
    );
    const activeLeaguesCount = leaguesRows[0]?.activeLeagues || 0;

    // 3. Calcul du rang global basé sur le nouveau total dynamique
    const [rankRows] = await pool.query(`
      SELECT COUNT(*) + 1 AS globalRank FROM (
        SELECT user_id, SUM(points_earned) AS pts FROM predictions GROUP BY user_id
      ) AS total_stats WHERE pts > ?
    `, [totalPoints]);
    const globalRank = rankRows[0]?.globalRank || 1;

    const userSummary = {
      username,
      totalPoints,
      globalRank,
      activeLeaguesCount
    };

    // 4. Récupération des actus
    const [newsRows] = await pool.query(
      'SELECT news_id, title, content, published_at FROM news ORDER BY published_at DESC LIMIT 3'
    );

    // 5. Récupération des matchs
    const [matchRows] = await pool.query(`
      SELECT m.match_id, m.stage, m.kickoff_at, m.status,
             t1.name AS home_team_name,
             t2.name AS away_team_name
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.team_id
      LEFT JOIN teams t2 ON m.away_team_id = t2.team_id
      ORDER BY m.kickoff_at ASC 
      LIMIT 5
    `);

    res.json({
      userSummary,
      upcomingMatches: matchRows,
      latestNews: newsRows
    });

  } catch (error) {
    console.error('❌ Erreur SQL Dashboard :', error);
    res.status(500).json({ error: 'Erreur interne du serveur lors du calcul des données réelles.' });
  }
};