const db = require('../config/db');
const bcrypt = require('bcrypt');
const standingsService = require('../services/standingsService');
const knockoutService = require('../services/knockoutService');
const { calculatePoints } = require('../services/predictionService');

// Recalcule points_earned pour toutes les prédictions d'un match terminé
const recalculatePredictions = async (matchId, homeScore, awayScore) => {
    const [preds] = await db.query(
        'SELECT prediction_id, predicted_home_score, predicted_away_score FROM predictions WHERE match_id = ?',
        [matchId]
    );
    for (const p of preds) {
        const points = calculatePoints(
            parseInt(p.predicted_home_score),
            parseInt(p.predicted_away_score),
            homeScore,
            awayScore
        );
        await db.query('UPDATE predictions SET points_earned = ? WHERE prediction_id = ?', [points, p.prediction_id]);
    }
};

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, super_admin: 3 };

const parseScore = (value) => {
    const score = Number(value);
    return Number.isInteger(score) && score >= 0 ? score : null;
};

const parseWinnerTeamId = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const winnerTeamId = Number(value);
    return Number.isInteger(winnerTeamId) ? winnerTeamId : NaN;
};

const resolveKnockoutWinner = (match, homeScore, awayScore, winnerTeamId) => {
    const validTeamIds = [match.home_team_id, match.away_team_id];

    if (winnerTeamId !== null && !validTeamIds.includes(winnerTeamId)) {
        return { error: 'Le vainqueur doit être une des deux équipes du match' };
    }

    if (homeScore > awayScore) {
        if (winnerTeamId !== null && winnerTeamId !== match.home_team_id) {
            return { error: 'Le vainqueur ne correspond pas au score saisi' };
        }
        return { winnerId: match.home_team_id };
    }

    if (awayScore > homeScore) {
        if (winnerTeamId !== null && winnerTeamId !== match.away_team_id) {
            return { error: 'Le vainqueur ne correspond pas au score saisi' };
        }
        return { winnerId: match.away_team_id };
    }

    if (winnerTeamId === null) {
        return { error: 'Un vainqueur est obligatoire pour un match de phase finale terminé à égalité' };
    }

    return { winnerId: winnerTeamId };
};

// GET /api/admin/users — lister les utilisateurs avec pagination et recherche
const getAllUsers = async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    const where  = search ? 'WHERE username LIKE ? OR email LIKE ?' : '';
    const params = search ? [search, search] : [];

    try {
        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
        const [users] = await db.query(
            `SELECT user_id, username, email, avatar_url, role, is_active, created_at, last_login FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
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
    const { home_score, away_score, status, winner_team_id } = req.body;

    if (home_score === undefined || away_score === undefined) {
        return res.status(400).json({ message: 'Les scores domicile et extérieur sont obligatoires' });
    }

    const homeScore = parseScore(home_score);
    const awayScore = parseScore(away_score);

    if (homeScore === null || awayScore === null) {
        return res.status(400).json({ message: 'Les scores doivent être des entiers positifs' });
    }

    const winnerTeamId = parseWinnerTeamId(winner_team_id);
    if (Number.isNaN(winnerTeamId)) {
        return res.status(400).json({ message: 'Le vainqueur doit être un identifiant d\'équipe valide' });
    }

    const newStatus = status || 'finished';

    try {
        const [matches] = await db.query(
            'SELECT match_id, competition_id, group_id, stage, home_team_id, away_team_id FROM matches WHERE match_id = ?',
            [id]
        );

        if (matches.length === 0) {
            return res.status(404).json({ message: 'Match introuvable' });
        }

        const match = matches[0];
        let knockoutWinnerId = null;

        if (newStatus === 'finished' && match.stage !== 'group') {
            const result = resolveKnockoutWinner(match, homeScore, awayScore, winnerTeamId);
            if (result.error) {
                return res.status(400).json({ message: result.error });
            }
            knockoutWinnerId = result.winnerId;
        }

        await db.query(
            'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE match_id = ?',
            [homeScore, awayScore, newStatus, id]
        );

        if (newStatus === 'finished') {
            if (match.stage === 'group' && match.group_id) {
                await standingsService.recalculateGroupStandings(match.competition_id, match.group_id);
            }

            if (match.stage !== 'group') {
                await knockoutService.updateBracketAfterMatch(id, knockoutWinnerId);
            }
        }

        res.json({ message: 'Score mis à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/users/:id/password — forcer un nouveau mot de passe (staff+)
const resetUserPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const actor = req.user;

    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    try {
        const [users] = await db.query('SELECT user_id, role FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const target = users[0];
        if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[target.role]) {
            return res.status(403).json({ message: 'Vous ne pouvez pas modifier un compte de rang égal ou supérieur' });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, id]);

        res.json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/admin/matches — lister les matchs avec pagination et filtres
const getAllMatches = async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { search, status, stage } = req.query;

    const where = [];
    const filterParams = [];

    if (search) {
        where.push('(home.name LIKE ? OR away.name LIKE ? OR home.fifa_code = ? OR away.fifa_code = ?)');
        filterParams.push(`%${search}%`, `%${search}%`, search.toUpperCase(), search.toUpperCase());
    }
    if (status) { where.push('m.status = ?'); filterParams.push(status); }
    if (stage)  { where.push('m.stage = ?');  filterParams.push(stage); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    try {
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM matches m
             JOIN teams home ON home.team_id = m.home_team_id
             JOIN teams away ON away.team_id = m.away_team_id
             ${whereClause}`,
            filterParams
        );

        const [matches] = await db.query(
            `SELECT m.match_id, m.match_number, m.stage, m.status, m.kickoff_at,
                    m.home_score, m.away_score, m.competition_id, m.group_id,
                    home.team_id AS home_team_id, home.name AS home_team_name, home.fifa_code AS home_team_code,
                    away.team_id AS away_team_id, away.name AS away_team_name, away.fifa_code AS away_team_code,
                    s.stadium_id, s.name AS stadium_name, s.city AS stadium_city,
                    gp.name AS group_name
             FROM matches m
             JOIN teams home ON home.team_id = m.home_team_id
             JOIN teams away ON away.team_id = m.away_team_id
             LEFT JOIN stadiums s ON s.stadium_id = m.stadium_id
             LEFT JOIN groups_pool gp ON gp.group_id = m.group_id
             ${whereClause}
             ORDER BY m.kickoff_at, m.match_number
             LIMIT ? OFFSET ?`,
            [...filterParams, limit, offset]
        );

        res.json({ matches, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/admin/matches/:id — modifier les informations d'un match
const updateMatch = async (req, res) => {
    const { id } = req.params;
    const { kickoff_at, stadium_id, status, home_score, away_score, winner_team_id } = req.body;

    const validStatuses = ['scheduled', 'live', 'finished', 'postponed'];
    if (status !== undefined && !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const hasScore = home_score !== undefined && away_score !== undefined;
    let homeScore, awayScore;
    if (hasScore) {
        homeScore = parseScore(home_score);
        awayScore = parseScore(away_score);
        if (homeScore === null || awayScore === null) {
            return res.status(400).json({ message: 'Les scores doivent être des entiers positifs' });
        }
    }

    try {
        const [matches] = await db.query(
            'SELECT match_id, competition_id, group_id, stage, status AS current_status, home_team_id, away_team_id FROM matches WHERE match_id = ?',
            [id]
        );

        if (matches.length === 0) return res.status(404).json({ message: 'Match introuvable' });
        const match = matches[0];

        const updates = [];
        const params = [];

        if (kickoff_at !== undefined) { updates.push('kickoff_at = ?'); params.push(kickoff_at); }
        if (stadium_id !== undefined) { updates.push('stadium_id = ?'); params.push(stadium_id || null); }
        if (status !== undefined)     { updates.push('status = ?');    params.push(status); }
        if (hasScore) {
            updates.push('home_score = ?'); params.push(homeScore);
            updates.push('away_score = ?'); params.push(awayScore);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
        }

        const finalStatus = status !== undefined ? status : match.current_status;
        let knockoutWinnerId = null;

        if (hasScore && finalStatus === 'finished' && match.stage !== 'group') {
            const parsedWinner = parseWinnerTeamId(winner_team_id);
            if (Number.isNaN(parsedWinner)) {
                return res.status(400).json({ message: "Le vainqueur doit être un identifiant d'équipe valide" });
            }
            const result = resolveKnockoutWinner(match, homeScore, awayScore, parsedWinner);
            if (result.error) {
                return res.status(400).json({ message: result.error });
            }
            knockoutWinnerId = result.winnerId;
        }

        params.push(id);
        await db.query(`UPDATE matches SET ${updates.join(', ')} WHERE match_id = ?`, params);

        if (hasScore && finalStatus === 'finished') {
            await recalculatePredictions(id, homeScore, awayScore);

            if (match.stage === 'group' && match.group_id) {
                await standingsService.recalculateGroupStandings(match.competition_id, match.group_id);
            }
            if (match.stage !== 'group') {
                await knockoutService.updateBracketAfterMatch(id, knockoutWinnerId);
            }
        }

        res.json({ message: 'Match mis à jour' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/admin/users/:id — supprimer un compte (super_admin uniquement)
const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.user.user_id) {
        return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    try {
        const [users] = await db.query('SELECT user_id, role FROM users WHERE user_id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        if (users[0].role === 'super_admin') {
            return res.status(403).json({ message: 'Impossible de supprimer un super-administrateur' });
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [id]);
        res.json({ message: 'Utilisateur supprimé' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = { getAllUsers, toggleUserActive, toggleUserRole, updateUserInfo, resetUserPassword, getAllMatches, updateMatch, updateMatchScore, deleteUser };
