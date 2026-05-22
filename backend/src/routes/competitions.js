const express = require('express');
const router = express.Router();
const { getCompetitions, getCompetitionById } = require('../controllers/competitionsController');

router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);

module.exports = router;
