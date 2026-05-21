const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
    });

    const sql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');

    await connection.query(sql);
    console.log('Base de données initialisée avec succès');
    await connection.end();
}

initDb().catch((err) => {
    console.error('Erreur :', err.message);
    process.exit(1);
});
