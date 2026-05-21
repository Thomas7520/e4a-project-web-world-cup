import axios from 'axios';

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

// Sur un 401 avec token (sauf /auth/me géré par AuthChecker), signale la déconnexion forcée
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthenticated = !!error.config.headers?.Authorization;
        const isAuthMe = error.config.url?.includes('/auth/me');

        if (error.response?.status === 401 && isAuthenticated && !isAuthMe) {
            localStorage.removeItem('token');
            const message = error.response?.data?.message || '';
            window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message } }));
        }
        return Promise.reject(error);
    }
);

export default api;
