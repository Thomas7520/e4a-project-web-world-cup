@echo off
cd frontend
if not exist node_modules (
    echo node_modules absent, installation en cours...
    npm install
)
npm run dev
