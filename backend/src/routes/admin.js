const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserActive, toggleUserRole, updateUserInfo, updateMatchScore } = require('../controllers/adminController');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const requireStaff = require('../middlewares/requireStaff');

router.use(requireAuth);

// GET  /api/admin/users — staff (modérateur+)
router.get('/users', requireStaff, getAllUsers);

// PUT  /api/admin/users/:id/disable — staff (modérateur+)
router.put('/users/:id/disable', requireStaff, toggleUserActive);

// PUT  /api/admin/users/:id/promote — admin+
router.put('/users/:id/promote', requireAdmin, toggleUserRole);

// PUT  /api/admin/users/:id — admin+
router.put('/users/:id', requireAdmin, updateUserInfo);

// PUT  /api/admin/matches/:id/score — admin+
router.put('/matches/:id/score', requireAdmin, updateMatchScore);

module.exports = router;
