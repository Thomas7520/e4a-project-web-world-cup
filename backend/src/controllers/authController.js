const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// POST /api/auth/register
const register = async (req, res) => {
    const { username, email, password } = req.body;

    // Validation des champs obligatoires
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        // Vérifier si l'email ou le nom d'utilisateur est déjà pris
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Cet email ou ce nom d'utilisateur est déjà utilisé" });
        }

        // Hashage du mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertion en base de données
        await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        res.status(201).json({ message: 'Compte créé avec succès' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe obligatoires' });
    }

    try {
        // Recherche de l'utilisateur par email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérification du mot de passe
        const passwordValid = await bcrypt.compare(password, user.password_hash);

        if (!passwordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Mise à jour de la date de dernière connexion
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Génération du token JWT
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                is_admin: user.is_admin,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    // Avec JWT, la déconnexion se gère côté client (suppression du token)
    res.json({ message: 'Déconnexion réussie' });
};

// GET /api/auth/me
// Appelé par le frontend au chargement de l'app pour récupérer les infos de
// l'utilisateur connecté à partir de son token JWT (ex: après un refresh de page).
const me = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, username, email, avatar_url, is_admin, created_at, last_login FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        res.json(users[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { register, login, logout, me };
