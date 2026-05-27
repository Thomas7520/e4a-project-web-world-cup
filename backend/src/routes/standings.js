const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standingsController');
const requireAdmin = require('../middlewares/requireAdmin');

/**
 * GET /api/standings?group_id=X
 * Récupère le classement d'un groupe spécifique
 */
router.get('/', standingsController.getGroupStandings);

/**
 * GET /api/standings/competition/:id
 * Récupère tous les classements d'une compétition
 */
router.get('/competition/:id', standingsController.getCompetitionStandings);

/**
 * GET /api/standings/group/:groupId/qualified
 * Récupère les deux équipes qualifiées d'un groupe
 */
router.get('/group/:groupId/qualified', standingsController.getQualifiedTeams);

/**
 * POST /api/standings/initialize/:competitionId
 * Initialise les standings pour une compétition (Admin only)
 */
router.post('/initialize/:competitionId', requireAdmin, standingsController.initializeStandings);

module.exports = router;
