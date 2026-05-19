const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Import des routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');

// Déclaration des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'API Coupe du Monde - Serveur en ligne' });
});

// Démarrage du serveur uniquement si le fichier est exécuté directement
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
}

module.exports = app;
