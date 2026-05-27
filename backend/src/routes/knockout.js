const express = require('express');
const router = express.Router();
const knockoutController = require('../controllers/knockoutController');
const requireAdmin = require('../middlewares/requireAdmin');

router.get('/:competitionId', knockoutController.getKnockoutBracket);
router.get('/:competitionId/stage/:stage', knockoutController.getStageMatches);
router.post('/initialize/:competitionId', requireAdmin, knockoutController.initializeKnockoutBracket);

module.exports = router;
