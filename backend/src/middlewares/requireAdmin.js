const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
};

module.exports = requireAdmin;
