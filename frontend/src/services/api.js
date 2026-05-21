import axios from 'axios';

// Instance axios avec l'URL de base de l'API
const api = axios.create({
    baseURL: '/api',
});

// Ajoute automatiquement le token JWT dans chaque requête si disponible
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
