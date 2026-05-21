const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads/avatars'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${req.user.user_id}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
