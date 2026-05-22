const express = require('express');
const router = express.Router();
const { getPlayerById } = require('../controllers/playersController');

router.get('/:id', getPlayerById);

module.exports = router;
