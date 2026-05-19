const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserActive, toggleUserAdmin, updateMatchScore } = require('../controllers/adminController');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');

// Toutes les routes admin nécessitent d'être connecté ET administrateur
router.use(requireAuth, requireAdmin);

// GET  /api/admin/users
router.get('/users', getAllUsers);

// PUT  /api/admin/users/:id/disable
router.put('/users/:id/disable', toggleUserActive);

// PUT  /api/admin/users/:id/promote
router.put('/users/:id/promote', toggleUserAdmin);

// PUT  /api/admin/matches/:id/score
router.put('/matches/:id/score', updateMatchScore);

module.exports = router;
