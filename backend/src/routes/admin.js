const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserActive, toggleUserRole, updateUserInfo, resetUserPassword, getAllMatches, updateMatch, updateMatchScore, deleteUser } = require('../controllers/adminController');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const requireStaff = require('../middlewares/requireStaff');
const requireSuperAdmin = require('../middlewares/requireSuperAdmin');

router.use(requireAuth);

// GET  /api/admin/users — staff (modérateur+)
router.get('/users', requireStaff, getAllUsers);

// PUT  /api/admin/users/:id/disable — staff (modérateur+)
router.put('/users/:id/disable', requireStaff, toggleUserActive);

// PUT  /api/admin/users/:id/password — staff (modérateur+)
router.put('/users/:id/password', requireStaff, resetUserPassword);

// PUT  /api/admin/users/:id/promote — admin+
router.put('/users/:id/promote', requireAdmin, toggleUserRole);

// PUT  /api/admin/users/:id — admin+
router.put('/users/:id', requireAdmin, updateUserInfo);

// GET  /api/admin/matches — staff (modérateur+)
router.get('/matches', requireStaff, getAllMatches);

// PUT  /api/admin/matches/:id — admin+
router.put('/matches/:id', requireAdmin, updateMatch);

// PUT  /api/admin/matches/:id/score — admin+
router.put('/matches/:id/score', requireAdmin, updateMatchScore);

// DELETE /api/admin/users/:id — super_admin uniquement
router.delete('/users/:id', requireSuperAdmin, deleteUser);

module.exports = router;
