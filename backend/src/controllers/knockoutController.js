const db = require('../config/db');
const knockoutService = require('../services/knockoutService');

/**
 * GET /api/knockout/:competitionId
 * Récupère l'arbre complet des phases finales pour une compétition
 */
const getKnockoutBracket = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const [competition] = await db.query(
      'SELECT competition_id, name, year FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    const bracket = await knockoutService.getKnockoutBracket(competitionId);

    res.status(200).json({
      success: true,
      competition: competition[0],
      bracket,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du bracket:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * GET /api/knockout/:competitionId/stage/:stage
 * Récupère les matchs d'une phase spécifique
 */
const getStageMatches = async (req, res) => {
  try {
    const { competitionId, stage } = req.params;

    const [competition] = await db.query(
      'SELECT competition_id FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    const matches = await knockoutService.getStageMatches(competitionId, stage);

    res.status(200).json({ success: true, stage, matches });
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs du stage:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * POST /api/knockout/initialize/:competitionId
 * Initialise le bracket pour une compétition (admin only)
 */
const initializeKnockoutBracket = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const [competition] = await db.query(
      'SELECT competition_id FROM competitions WHERE competition_id = ?',
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({ success: false, message: 'Compétition non trouvée' });
    }

    await knockoutService.initializeKnockoutBracket(competitionId);

    res.status(200).json({ success: true, message: 'Knockout bracket initialisé' });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du bracket:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  getKnockoutBracket,
  getStageMatches,
  initializeKnockoutBracket,
};
