const bcrypt = require('bcrypt');
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
            return res.status(409).json({ message: 'Cet email ou ce nom d\'utilisateur est déjà utilisé' });
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

module.exports = { register };
