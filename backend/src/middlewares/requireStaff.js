const requireStaff = (req, res, next) => {
    if (!req.user || !['moderator', 'admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Accès réservé au staff' });
    }
    next();
};

module.exports = requireStaff;
