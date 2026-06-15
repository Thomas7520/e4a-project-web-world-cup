# MondialPronos

Plateforme web de suivi de la Coupe du Monde avec système de pronostics entre amis.

## Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | React 19, Vite, React Router, Axios, SweetAlert2, react-select |
| Backend | Node.js, Express 5, MySQL2 |
| Auth | JWT (jsonwebtoken), bcrypt |
| BDD | MySQL |

## Prérequis

- Node.js 18+
- Accès à la base de données MySQL (VPS)

## Installation & lancement

### Option rapide (Windows)

Double-cliquer sur `start-server.bat` pour le backend et `start-frontend.bat` pour le frontend. Les scripts installent automatiquement les dépendances si `node_modules` est absent.

### Manuel

**Backend**
```bash
cd backend
npm install
npm run dev       # nodemon — port 3000
```

**Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev       # Vite — port 5173
```

## Variables d'environnement

Copier `backend/.env.example` en `backend/.env` et remplir les valeurs :

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=world_cup

JWT_SECRET=
JWT_EXPIRES_IN=24h

PORT=3000
```

## Structure du projet

```
/
├── backend/
│   ├── server.js
│   └── src/
│       ├── config/         # Connexion MySQL
│       ├── controllers/    # Logique métier
│       ├── middlewares/    # Auth JWT, validation, rôles
│       ├── routes/         # Endpoints API
│       ├── services/       # Standings, knockout, prédictions, stats
│       └── tests/
├── frontend/
│   └── src/
│       ├── components/     # Header, ProtectedRoute
│       ├── contexts/       # AuthContext, ToastContext
│       ├── pages/          # Toutes les pages
│       └── services/       # Instance Axios
├── start-server.bat
└── start-frontend.bat
```

## Fonctionnalités

- Matchs, groupes, classements, phase finale (bracket)
- Équipes, joueurs, statistiques, stades
- Pronostics avec calcul de points (0 / 1 / 3 / 5)
- Ligues privées entre amis (code d'invitation)
- Dashboard personnel (rang, points, prochains matchs)
- Actualités
- Panel d'administration (gestion utilisateurs, matchs, news)

## Rôles utilisateurs

| Rôle | Niveau | Permissions |
|------|--------|-------------|
| user | 0 | Lecture, pronostics, ligues |
| moderator | 1 | + Réinitialisation de mot de passe |
| admin | 2 | + Modification des matchs, news |
| super_admin | 3 | + Suppression de comptes |

## API — principales routes

| Méthode | Route | Accès |
|---------|-------|-------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/matches` | Public |
| GET | `/api/standings` | Public |
| GET | `/api/knockout/:id` | Public |
| POST | `/api/predictions` | Connecté |
| POST | `/api/leagues` | Connecté |
| GET | `/api/dashboard` | Connecté |
| GET | `/api/admin/users` | Staff+ |
| PUT | `/api/admin/matches/:id` | Admin+ |
| DELETE | `/api/admin/users/:id` | Super admin |

## Tests

```bash
cd backend
npm test
```
