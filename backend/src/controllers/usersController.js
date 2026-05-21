const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
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
    const { username, email } = req.body;

    try {
        const [conflict] = await db.query(
            'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
            [username, email, req.user.user_id]
        );

        if (conflict.length > 0) {
            return res.status(409).json({ message: "Ce nom d'utilisateur ou cet email est déjà utilisé" });
        }

        await db.query(
            'UPDATE users SET username = ?, email = ? WHERE user_id = ?',
            [username, email, req.user.user_id]
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

// PUT /api/users/me/password
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!valid) {
            return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, req.user.user_id]);

        res.json({ message: 'Mot de passe mis à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/users/me/avatar
const uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    try {
        const [rows] = await db.query('SELECT avatar_url FROM users WHERE user_id = ?', [req.user.user_id]);
        const oldUrl = rows[0]?.avatar_url;

        if (oldUrl && oldUrl.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../../', oldUrl);
            fs.unlink(oldPath, () => {});
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await db.query('UPDATE users SET avatar_url = ? WHERE user_id = ?', [avatarUrl, req.user.user_id]);

        res.json({ message: 'Avatar mis à jour', avatar_url: avatarUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/users/me/avatar
const deleteAvatar = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT avatar_url FROM users WHERE user_id = ?', [req.user.user_id]);
        const oldUrl = rows[0]?.avatar_url;

        if (oldUrl && oldUrl.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../../', oldUrl);
            fs.unlink(oldPath, () => {});
        }

        await db.query('UPDATE users SET avatar_url = NULL WHERE user_id = ?', [req.user.user_id]);
        res.json({ message: 'Avatar supprimé' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getProfile, updateProfile, changePassword, uploadAvatar, deleteAvatar };
