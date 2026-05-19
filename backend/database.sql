CREATE DATABASE IF NOT EXISTS coupe_du_monde;
USE coupe_du_monde;

CREATE TABLE IF NOT EXISTS users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url  VARCHAR(255) DEFAULT NULL,
    is_admin    TINYINT(1)   DEFAULT 0,
    is_active   TINYINT(1)   DEFAULT 1,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_login  TIMESTAMP    DEFAULT NULL
);
