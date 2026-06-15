const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const requireAuth = require('../middlewares/requireAuth'); 

router.get('/dashboard', requireAuth, dashboardController.getDashboardData);

module.exports = router;