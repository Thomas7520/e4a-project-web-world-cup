const db = require('../config/db');
const statsService = require('../services/statsService');

const getTopScorers = async (req, res) => {
  try {
    const competitionId = parseInt(req.query.competition_id, 10);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    if (!competitionId) {
      return res.status(400).json({ success: false, message: 'Le paramètre competition_id est requis' });
    }

    const [competition] = await db.query(
      'SELECT competition_id, name, year FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    const scorers = await statsService.getTopScorers(competitionId, limit);

    res.status(200).json({
      success: true,
      competition: competition[0],
      limit,
      top_scorers: scorers,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs buteurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

const getTopAssists = async (req, res) => {
  try {
    const competitionId = parseInt(req.query.competition_id, 10);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    if (!competitionId) {
      return res.status(400).json({ success: false, message: 'Le paramètre competition_id est requis' });
    }

    const [competition] = await db.query(
      'SELECT competition_id, name, year FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    const assists = await statsService.getTopAssists(competitionId, limit);

    res.status(200).json({
      success: true,
      competition: competition[0],
      limit,
      top_assists: assists,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs passeurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

const getCompetitionStats = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const [competition] = await db.query(
      'SELECT competition_id, name, year FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    const stats = await statsService.getCompetitionStats(competitionId);

    res.status(200).json({
      success: true,
      competition: competition[0],
      stats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de compétition:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  getTopScorers,
  getTopAssists,
  getCompetitionStats,
};
