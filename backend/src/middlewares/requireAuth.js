const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Le header doit être de la forme : "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès refusé : token manquant' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await db.query(
            'SELECT is_active FROM users WHERE user_id = ?',
            [decoded.user_id]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ message: 'Compte désactivé ou introuvable' });
        }

        req.user = decoded; // { user_id, username, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
};

module.exports = verifyToken;
