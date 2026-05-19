const db = require('../config/db');

// GET /api/users/me
const getProfile = async (req, res) => {
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

// PUT /api/users/me
const updateProfile = async (req, res) => {
    const { username, avatar_url } = req.body;

    try {
        // Vérifier que le nouveau username n'est pas déjà pris par un autre utilisateur
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
            [username, req.user.user_id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Ce nom d'utilisateur est déjà utilisé" });
        }

        await db.query(
            'UPDATE users SET username = ?, avatar_url = ? WHERE user_id = ?',
            [username, avatar_url || null, req.user.user_id]
        );

        const [updatedUsers] = await db.query(
            'SELECT user_id, username, email, avatar_url, is_admin, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        res.json({ message: 'Profil mis à jour', user: updatedUsers[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getProfile, updateProfile };
