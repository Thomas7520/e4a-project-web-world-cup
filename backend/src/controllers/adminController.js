const db = require('../config/db');

// GET /api/admin/users — lister tous les utilisateurs
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, username, email, avatar_url, is_admin, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
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

    try {
        const [users] = await db.query(
            'SELECT user_id, is_active FROM users WHERE user_id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        // On inverse l'état actuel
        const newStatus = users[0].is_active ? 0 : 1;

        await db.query(
            'UPDATE users SET is_active = ? WHERE user_id = ?',
            [newStatus, id]
        );

        const message = newStatus ? 'Compte réactivé' : 'Compte désactivé';
        res.json({ message });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/users/:id/promote — promouvoir ou rétrograder un administrateur
const toggleUserAdmin = async (req, res) => {
    const { id } = req.params;

    // Un admin ne peut pas se rétrograder lui-même
    if (parseInt(id) === req.user.user_id) {
        return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    try {
        const [users] = await db.query(
            'SELECT user_id, is_admin FROM users WHERE user_id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        const newRole = users[0].is_admin ? 0 : 1;

        await db.query(
            'UPDATE users SET is_admin = ? WHERE user_id = ?',
            [newRole, id]
        );

        const message = newRole ? 'Utilisateur promu administrateur' : 'Droits administrateur retirés';
        res.json({ message });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/matches/:id/score — saisie manuelle du score d'un match
// Utilisé pour finaliser un match et déclencher le calcul des classements (Personne 2 & 3)
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

module.exports = { getAllUsers, toggleUserActive, toggleUserAdmin, updateMatchScore };
