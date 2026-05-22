const express = require('express');
const router = express.Router();
const { getMatches, getMatchById } = require('../controllers/matchesController');

router.get('/', getMatches);
router.get('/:id', getMatchById);

module.exports = router;
