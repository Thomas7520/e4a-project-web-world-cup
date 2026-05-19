const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me (route protégée)
router.get('/me', verifyToken, me);

module.exports = router;
