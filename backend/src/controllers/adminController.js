const db = require('../config/db');

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, super_admin: 3 };

// GET /api/admin/users — lister tous les utilisateurs
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, username, email, avatar_url, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/users/:id/disable — activer ou désactiver un compte
const toggleUserActive = async (req, res) => {
    const { id } = req.params;
    const actor = req.user;

    try {
        const [users] = await db.query(
            'SELECT user_id, role, is_active FROM users WHERE user_id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const target = users[0];

        if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[target.role]) {
            return res.status(403).json({ message: 'Vous ne pouvez pas modifier un compte de rang égal ou supérieur' });
        }

        const newStatus = target.is_active ? 0 : 1;

        await db.query('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, id]);

        res.json({ message: newStatus ? 'Compte réactivé' : 'Compte désactivé' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/users/:id/promote — changer le rôle d'un utilisateur
const toggleUserRole = async (req, res) => {
    const { id } = req.params;
    const { role: newRole } = req.body;
    const actor = req.user;

    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    if (parseInt(id) === actor.user_id) {
        return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    try {
        const [users] = await db.query(
            'SELECT user_id, role FROM users WHERE user_id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const target = users[0];

        if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[target.role]) {
            return res.status(403).json({ message: 'Vous ne pouvez pas modifier un compte de rang égal ou supérieur' });
        }

        if (ROLE_LEVEL[newRole] >= ROLE_LEVEL[actor.role]) {
            return res.status(403).json({ message: 'Vous ne pouvez pas attribuer un rang égal ou supérieur au vôtre' });
        }

        await db.query('UPDATE users SET role = ? WHERE user_id = ?', [newRole, id]);

        res.json({ message: `Rôle mis à jour` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/users/:id — modifier le nom d'utilisateur et l'email
const updateUserInfo = async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;

    try {
        const [conflict] = await db.query(
            'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
            [username, email, id]
        );

        if (conflict.length > 0) {
            return res.status(409).json({ message: "Ce nom d'utilisateur ou cet email est déjà utilisé" });
        }

        await db.query(
            'UPDATE users SET username = ?, email = ? WHERE user_id = ?',
            [username, email, id]
        );

        res.json({ message: 'Utilisateur mis à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/matches/:id/score — saisie manuelle du score d'un match
const updateMatchScore = async (req, res) => {
    const { id } = req.params;
    const { home_score, away_score, status } = req.body;

    if (home_score === undefined || away_score === undefined) {
        return res.status(400).json({ message: 'Les scores domicile et extérieur sont obligatoires' });
    }

    try {
        await db.query(
            'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE match_id = ?',
            [home_score, away_score, status || 'finished', id]
        );

        res.json({ message: 'Score mis à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getAllUsers, toggleUserActive, toggleUserRole, updateUserInfo, updateMatchScore };
