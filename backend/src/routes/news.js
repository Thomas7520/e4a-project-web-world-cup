const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/news — public
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT n.news_id, n.title, n.content, n.image_url, n.published_at,
                   u.username AS author_name
            FROM news n
            LEFT JOIN users u ON n.author_id = u.user_id
            ORDER BY n.published_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erreur SQL News :', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des actualités.' });
    }
});

// POST /api/news — admin uniquement
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { title, content, image_url } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Le titre et le contenu sont requis.' });
    }
    const author_id = req.user.user_id || req.user.id;
    try {
        const [result] = await db.query(
            'INSERT INTO news (title, content, image_url, author_id) VALUES (?, ?, ?, ?)',
            [title, content, image_url || null, author_id]
        );
        res.status(201).json({ news_id: result.insertId, message: 'Actualité créée.' });
    } catch (error) {
        console.error('Erreur SQL POST news :', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/news/:id — admin uniquement
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    const { title, content, image_url } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Le titre et le contenu sont requis.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE news SET title = ?, content = ?, image_url = ? WHERE news_id = ?',
            [title, content, image_url || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Actualité introuvable.' });
        res.json({ message: 'Actualité mise à jour.' });
    } catch (error) {
        console.error('Erreur SQL PUT news :', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/news/:id — admin uniquement
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM news WHERE news_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Actualité introuvable.' });
        res.json({ message: 'Actualité supprimée.' });
    } catch (error) {
        console.error('Erreur SQL DELETE news :', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
