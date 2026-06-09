const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const requireAuth = require('../middlewares/requireAuth'); // 🛡️ Import de la sécurité de ton groupe

// L'endpoint exige désormais une session valide pour renvoyer des informations réelles
router.get('/dashboard', requireAuth, dashboardController.getDashboardData);

module.exports = router;