import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Redirige vers /login si l'utilisateur n'est pas connecté
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <p>Chargement...</p>;
    if (!user) return <Navigate to="/" />;

    return children;
}

// Redirige vers / si l'utilisateur n'est pas administrateur
export function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <p>Chargement...</p>;
    if (!user) return <Navigate to="/" />;
    if (!user.is_admin) return <Navigate to="/" />;

    return children;
}
