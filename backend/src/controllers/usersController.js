const db = require('../config/db');

// GET /api/users/me
const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, username, email, avatar_url, role, created_at, last_login FROM users WHERE user_id = ?',
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

// PUT /api/users/me
const updateProfile = async (req, res) => {
    const { username, email, avatar_url } = req.body;

    try {
        const [conflict] = await db.query(
            'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
            [username, email, req.user.user_id]
        );

        if (conflict.length > 0) {
            return res.status(409).json({ message: "Ce nom d'utilisateur ou cet email est déjà utilisé" });
        }

        await db.query(
            'UPDATE users SET username = ?, email = ?, avatar_url = ? WHERE user_id = ?',
            [username, email, avatar_url || null, req.user.user_id]
        );

        const [updatedUsers] = await db.query(
            'SELECT user_id, username, email, avatar_url, role, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        res.json({ message: 'Profil mis à jour', user: updatedUsers[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getProfile, updateProfile };
