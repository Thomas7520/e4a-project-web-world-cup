const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/top_scorers', statsController.getTopScorers);
router.get('/top_assists', statsController.getTopAssists);
router.get('/competition/:competitionId', statsController.getCompetitionStats);

module.exports = router;
