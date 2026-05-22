const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import des routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const adminRoutes = require('./src/routes/admin');
const competitionRoutes = require('./src/routes/competitions');
const teamRoutes = require('./src/routes/teams');
const playerRoutes = require('./src/routes/players');
const groupRoutes = require('./src/routes/groups');
const matchRoutes = require('./src/routes/matches');
const stadiumRoutes = require('./src/routes/stadiums');

// Déclaration des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/stadiums', stadiumRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'API Coupe du Monde - Serveur en ligne' });
});

// Démarrage du serveur uniquement si le fichier est exécuté directement

// Intercepte les erreurs Express non gérées
app.use((err, req, res, next) => {
    console.error('ERREUR EXPRESS NON GÉRÉE:', err);
    res.status(500).json({ message: 'Erreur serveur', debug: err.message });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
}

module.exports = app;
