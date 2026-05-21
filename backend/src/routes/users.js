const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getProfile, updateProfile, changePassword } = require('../controllers/usersController');
const requireAuth = require('../middlewares/requireAuth');
const validate = require('../middlewares/validate');

// GET /api/users/me (route protégée)
router.get('/me', requireAuth, getProfile);
// PUT /api/users/me (route protégée)
router.put('/me',
    requireAuth,
    body('username').notEmpty().withMessage("Le nom d'utilisateur est obligatoire").isLength({ min: 3 }).withMessage("Le nom d'utilisateur doit contenir au moins 3 caractères"),
    body('email').isEmail().withMessage('Email invalide'),
    body('avatar_url').optional().isURL().withMessage("URL de l'avatar invalide"),
    validate,
    updateProfile
);

// PUT /api/users/me/password (route protégée)
router.put('/me/password',
    requireAuth,
    body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est obligatoire'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|`~]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    validate,
    changePassword
);

module.exports = router;
