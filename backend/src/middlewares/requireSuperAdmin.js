const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Accès réservé au super-administrateur' });
    }
    next();
};

module.exports = requireSuperAdmin;
