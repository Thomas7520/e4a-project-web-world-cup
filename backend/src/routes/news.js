const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Utilise la connexion de ton groupe

// GET /api/news
router.get('/', async (req, res) => {
  try {
    // 🔄 Jointure SQL pour récupérer le vrai pseudo de l'auteur
    const [rows] = await db.query(`
      SELECT n.news_id, n.title, n.content, n.published_at, u.username AS author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.user_id
      ORDER BY n.published_at DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error("Erreur SQL News :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des actualités." });
  }
});

module.exports = router;