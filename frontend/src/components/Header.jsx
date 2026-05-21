import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import AuthModal from './AuthModal';
import './Header.css';

const IconMenu = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const IconClose = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconChevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export default function Header() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [modalOpen, setModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState(user?.avatar_url || null);
    const dropdownRef = useRef(null);

    useEffect(() => { setAvatarSrc(user?.avatar_url || null); }, [user?.avatar_url]);

    // Ferme le menu hamburger sur changement de page
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    // Ferme le menu hamburger si la fenêtre est agrandie au-delà du breakpoint
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ferme le dropdown si clic en dehors
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await api.post('/auth/logout');
        logout();
        setDropdownOpen(false);
        setMenuOpen(false);
        navigate('/');
        addToast('Vous avez été déconnecté', 'info');
    };

    const isStaff = user && ['moderator', 'admin', 'super_admin'].includes(user.role);

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <Link to="/" className="header-logo">⚽ Coupe du Monde 2026</Link>
                    <nav className="header-main-nav">
                        <Link to="/" className="header-link">Accueil</Link>
                        <Link to="/matches" className="header-link">Matchs</Link>
                        <Link to="/paris" className="header-link">Paris</Link>
                    </nav>
                </div>

                <div className="header-right">
                    {user ? (
                        <div className="header-user" ref={dropdownRef}>
                            <button
                                className="header-user-btn"
                                onClick={() => setDropdownOpen(o => !o)}
                            >
                                {avatarSrc
                                    ? <img src={avatarSrc} alt="avatar" className="header-avatar" onError={() => setAvatarSrc(null)} />
                                    : <span className="header-avatar-placeholder">{user.username[0].toUpperCase()}</span>
                                }
                                <span className="header-username">{user.username}</span>
                                <IconChevron />
                            </button>

                            {dropdownOpen && (
                                <div className="header-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        Mon profil
                                    </Link>
                                    {isStaff && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            Administration
                                        </Link>
                                    )}
                                    <div className="dropdown-separator" />
                                    <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => setModalOpen(true)} className="header-auth-btn">
                            Connexion
                        </button>
                    )}

                    <button className="header-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                        {menuOpen ? <IconClose /> : <IconMenu />}
                    </button>
                </div>

                {menuOpen && (
                    <nav className="header-mobile-nav">
                        <Link to="/" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Accueil</Link>
                        <Link to="/matches" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Matchs</Link>
                        <Link to="/paris" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Paris</Link>
                        <div className="mobile-nav-separator" />
                        {user ? (
                            <>
                                <Link to="/profile" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Mon profil</Link>
                                {isStaff && (
                                    <Link to="/admin" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Administration</Link>
                                )}
                                <button onClick={handleLogout} className="mobile-nav-item mobile-nav-danger">Déconnexion</button>
                            </>
                        ) : (
                            <button onClick={() => { setModalOpen(true); setMenuOpen(false); }} className="mobile-nav-item">
                                Connexion
                            </button>
                        )}
                    </nav>
                )}
            </header>

            {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
        </>
    );
}
