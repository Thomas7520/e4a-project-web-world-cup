const express = require('express');
const router = express.Router();
const { getTeams, getTeamById } = require('../controllers/teamsController');

router.get('/', getTeams);
router.get('/:id', getTeamById);

module.exports = router;
