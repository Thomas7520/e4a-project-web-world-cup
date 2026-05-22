const db = require('../config/db');

/**
 * Service de calcul des statistiques de compétition
 * Meilleurs buteurs, passeurs, cartons, etc.
 */

/**
 * Récupère les meilleurs buteurs d'une compétition
 * @param {number} competitionId - ID de la compétition
 * @param {number} limit - Nombre de résultats (défaut: 10)
 * @returns {Promise<Array>}
 */
async function getTopScorers(competitionId, limit = 10) {
  try {
    const [scorers] = await db.query(
      `SELECT 
        p.player_id, p.full_name, p.shirt_number,
        t.team_id, t.name as team_name, t.fifa_code, t.flag_url,
        COUNT(e.event_id) as goals
      FROM players p
      JOIN teams t ON p.team_id = t.team_id
      JOIN events e ON p.player_id = e.player_id
      JOIN matches m ON e.match_id = m.match_id
      WHERE m.competition_id = ? 
        AND e.event_type = 'goal'
        AND m.status = 'finished'
        AND t.competition_id = ?
      GROUP BY p.player_id, t.team_id
      ORDER BY goals DESC
      LIMIT ?`,
      [competitionId, competitionId, limit]
    );

    return scorers;
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs buteurs:', error);
    throw error;
  }
}

/**
 * Récupère les meilleurs passeurs d'une compétition
 * @param {number} competitionId - ID de la compétition
 * @param {number} limit - Nombre de résultats (défaut: 10)
 * @returns {Promise<Array>}
 */
async function getTopAssists(competitionId, limit = 10) {
  try {
    const [assists] = await db.query(
      `SELECT 
        p.player_id, p.full_name, p.shirt_number,
        t.team_id, t.name as team_name, t.fifa_code, t.flag_url,
        COUNT(e.event_id) as assists
      FROM players p
      JOIN teams t ON p.team_id = t.team_id
      JOIN events e ON p.player_id = e.player_id
      JOIN matches m ON e.match_id = m.match_id
      WHERE m.competition_id = ? 
        AND e.event_type = 'assist'
        AND m.status = 'finished'
        AND t.competition_id = ?
      GROUP BY p.player_id, t.team_id
      ORDER BY assists DESC
      LIMIT ?`,
      [competitionId, competitionId, limit]
    );

    return assists;
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs passeurs:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques de cartons (jaunes et rouges)
 * @param {number} competitionId - ID de la compétition
 * @param {number} limit - Nombre de résultats (défaut: 10)
 * @returns {Promise<Object>}
 */
async function getCardStats(competitionId, limit = 10) {
  try {
    const [yellowCards] = await db.query(
      `SELECT 
        p.player_id, p.full_name, p.shirt_number,
        t.team_id, t.name as team_name, t.fifa_code, t.flag_url,
        COUNT(e.event_id) as yellow_cards
      FROM players p
      JOIN teams t ON p.team_id = t.team_id
      JOIN events e ON p.player_id = e.player_id
      JOIN matches m ON e.match_id = m.match_id
      WHERE m.competition_id = ? 
        AND e.event_type = 'yellow_card'
        AND m.status = 'finished'
        AND t.competition_id = ?
      GROUP BY p.player_id, t.team_id
      ORDER BY yellow_cards DESC
      LIMIT ?`,
      [competitionId, competitionId, limit]
    );

    const [redCards] = await db.query(
      `SELECT 
        p.player_id, p.full_name, p.shirt_number,
        t.team_id, t.name as team_name, t.fifa_code, t.flag_url,
        COUNT(e.event_id) as red_cards
      FROM players p
      JOIN teams t ON p.team_id = t.team_id
      JOIN events e ON p.player_id = e.player_id
      JOIN matches m ON e.match_id = m.match_id
      WHERE m.competition_id = ? 
        AND e.event_type = 'red_card'
        AND m.status = 'finished'
        AND t.competition_id = ?
      GROUP BY p.player_id, t.team_id
      ORDER BY red_cards DESC
      LIMIT ?`,
      [competitionId, competitionId, limit]
    );

    return {
      yellow_cards: yellowCards,
      red_cards: redCards,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de cartons:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques complètes d'une compétition
 * @param {number} competitionId - ID de la compétition
 * @returns {Promise<Object>}
 */
async function getCompetitionStats(competitionId) {
  try {
    const stats = {
      top_scorers: await getTopScorers(competitionId, 15),
      top_assists: await getTopAssists(competitionId, 15),
      cards: await getCardStats(competitionId, 10),
    };

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats complètes:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'un joueur spécifique
 * @param {number} playerId - ID du joueur
 * @returns {Promise<Object>}
 */
async function getPlayerStats(playerId) {
  try {
    const [player] = await db.query(
      `SELECT p.*, t.name as team_name, t.fifa_code 
       FROM players p
       JOIN teams t ON p.team_id = t.team_id
       WHERE p.player_id = ?`,
      [playerId]
    );

    if (player.length === 0) {
      return null;
    }

    const [events] = await db.query(
      `SELECT 
        e.event_type, COUNT(e.event_id) as count
      FROM events e
      WHERE e.player_id = ?
      GROUP BY e.event_type`,
      [playerId]
    );

    const stats = {
      player: player[0],
      events: {},
    };

    for (const event of events) {
      stats.events[event.event_type] = event.count;
    }

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats du joueur:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques par équipe
 * @param {number} competitionId - ID de la compétition
 * @returns {Promise<Array>}
 */
async function getTeamStats(competitionId) {
  try {
    const [stats] = await db.query(
      `SELECT 
        t.team_id, t.name, t.fifa_code, t.flag_url,
        COUNT(DISTINCT CASE WHEN e.event_type = 'goal' THEN e.event_id END) as total_goals,
        COUNT(DISTINCT CASE WHEN e.event_type = 'assist' THEN e.event_id END) as total_assists,
        COUNT(DISTINCT CASE WHEN e.event_type = 'yellow_card' THEN e.event_id END) as total_yellow_cards,
        COUNT(DISTINCT CASE WHEN e.event_type = 'red_card' THEN e.event_id END) as total_red_cards
      FROM teams t
      LEFT JOIN events e ON t.team_id = e.team_id
      LEFT JOIN matches m ON e.match_id = m.match_id
      WHERE t.competition_id = ? AND (m.competition_id = ? OR e.event_id IS NULL)
      GROUP BY t.team_id
      ORDER BY total_goals DESC`,
      [competitionId, competitionId]
    );

    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats des équipes:', error);
    throw error;
  }
}

module.exports = {
  getTopScorers,
  getTopAssists,
  getCardStats,
  getCompetitionStats,
  getPlayerStats,
  getTeamStats,
};
