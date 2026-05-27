const standingsService = require('../services/standingsService');
const db = require('../config/db');

/**
 * Récupère le classement d'un groupe spécifique
 * GET /api/standings?group_id=X
 */
exports.getGroupStandings = async (req, res) => {
  try {
    const { group_id } = req.query;

    if (!group_id) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre group_id est requis',
      });
    }

    // Vérifier que le groupe existe
    const [group] = await db.query(
      `SELECT group_id, name, competition_id FROM groups_pool WHERE group_id = ?`,
      [group_id]
    );

    if (group.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    // Récupérer les standings
    const standings = await standingsService.getGroupStandings(group_id);

    res.status(200).json({
      success: true,
      group: {
        group_id: group[0].group_id,
        name: group[0].name,
        competition_id: group[0].competition_id,
      },
      standings: standings,
      total: standings.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des standings du groupe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

/**
 * Récupère tous les classements d'une compétition
 * GET /api/standings/competition/:id
 */
exports.getCompetitionStandings = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la compétition existe
    const [competition] = await db.query(
      `SELECT competition_id, name, year FROM competitions WHERE competition_id = ?`,
      [id]
    );

    if (competition.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétition non trouvée',
      });
    }

    // Vérifier qu'il y a au moins un groupe
    const [groups] = await db.query(
      `SELECT COUNT(*) as total FROM groups_pool WHERE competition_id = ?`,
      [id]
    );

    if (groups[0].total === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun groupe trouvé pour cette compétition',
      });
    }

    // Récupérer tous les standings
    const standings = await standingsService.getCompetitionStandings(id);

    res.status(200).json({
      success: true,
      competition: {
        competition_id: competition[0].competition_id,
        name: competition[0].name,
        year: competition[0].year,
      },
      standings: standings,
      groups_count: Object.keys(standings).length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des standings de la compétition:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

/**
 * Récupère les deux équipes qualifiées d'un groupe
 * GET /api/standings/group/:groupId/qualified
 */
exports.getQualifiedTeams = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Vérifier que le groupe existe
    const [group] = await db.query(
      `SELECT group_id, name FROM groups_pool WHERE group_id = ?`,
      [groupId]
    );

    if (group.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    // Récupérer les qualifiés
    const qualified = await standingsService.getQualifiedTeams(groupId);

    if (qualified.length < 2) {
      return res.status(200).json({
        success: true,
        message: 'Pas assez d\'équipes qualifiées',
        group: group[0],
        qualified: qualified,
      });
    }

    res.status(200).json({
      success: true,
      group: group[0],
      qualified: qualified,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des qualifiés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

/**
 * Initialise les standings pour une compétition (utile pour démarrage)
 * POST /api/standings/initialize/:competitionId
 * Admin only
 */
exports.initializeStandings = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Vérifier que la compétition existe
    const [competition] = await db.query(
      `SELECT competition_id, name FROM competitions WHERE competition_id = ?`,
      [competitionId]
    );

    if (competition.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétition non trouvée',
      });
    }

    // Récupérer tous les groupes
    const [groups] = await db.query(
      `SELECT group_id FROM groups_pool WHERE competition_id = ?`,
      [competitionId]
    );

    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun groupe trouvé pour cette compétition',
      });
    }

    // Initialiser les standings pour chaque groupe
    for (const group of groups) {
      await standingsService.initializeGroupStandings(competitionId, group.group_id);
    }

    res.status(200).json({
      success: true,
      message: 'Standings initialisés avec succès',
      competition_id: competitionId,
      groups_initialized: groups.length,
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des standings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
