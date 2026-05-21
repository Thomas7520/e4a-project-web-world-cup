import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import AuthModal from './AuthModal';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const handleLogout = async () => {
        await api.post('/auth/logout');
        logout();
        navigate('/');
    };

    return (
        <>
            <header className="header">
                <Link to="/" className="header-logo">⚽ Coupe du Monde 2026</Link>

                <nav className="header-nav">
                    {user ? (
                        <>
                            <Link to="/profile" className="header-link">
                                {user.avatar_url
                                    ? <img src={user.avatar_url} alt="avatar" className="header-avatar" />
                                    : <span className="header-avatar-placeholder">{user.username[0].toUpperCase()}</span>
                                }
                                {user.username}
                            </Link>
                            {user.is_admin && (
                                <Link to="/admin" className="header-link">Administration</Link>
                            )}
                            <button onClick={handleLogout} className="header-logout-btn">Déconnexion</button>
                        </>
                    ) : (
                        <button onClick={() => setModalOpen(true)} className="header-auth-btn">
                            Connexion
                        </button>
                    )}
                </nav>
            </header>

            {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
        </>
    );
}
