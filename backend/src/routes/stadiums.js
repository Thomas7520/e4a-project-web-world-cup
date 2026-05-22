const express = require('express');
const router = express.Router();
const { getStadiums } = require('../controllers/stadiumsController');

router.get('/', getStadiums);

module.exports = router;
