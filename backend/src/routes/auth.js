const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const requireAuth = require('../middlewares/requireAuth');
const validate = require('../middlewares/validate');

// POST /api/auth/register
router.post('/register',
    body('username').notEmpty().withMessage("Le nom d'utilisateur est obligatoire").isLength({ min: 3 }).withMessage("Le nom d'utilisateur doit contenir au moins 3 caractères"),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|`~]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    validate,
    register
);

// POST /api/auth/login
router.post('/login',
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
    validate,
    login
);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me (route protégée)
// Appelé par le frontend au chargement pour récupérer l'utilisateur connecté
router.get('/me', requireAuth, me);

module.exports = router;
