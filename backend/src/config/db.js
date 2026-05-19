const mysql = require('mysql2/promise');
require('dotenv').config();

// Création du pool de connexions à la base de données
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Vérification de la connexion au démarrage
pool.getConnection()
    .then(connection => {
        console.log('Connexion à la base de données réussie');
        connection.release();
    })
    .catch(err => {
        console.error('Erreur de connexion à la base de données :', err.message);
    });

module.exports = pool;
