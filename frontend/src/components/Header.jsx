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
    const [userDropOpen, setUserDropOpen] = useState(false);
    const [compDropOpen, setCompDropOpen] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState(user?.avatar_url || null);

    const userDropRef = useRef(null);
    const compDropRef = useRef(null);

    useEffect(() => { setAvatarSrc(user?.avatar_url || null); }, [user?.avatar_url]);
    useEffect(() => { setMenuOpen(false); setCompDropOpen(false); setUserDropOpen(false); }, [location.pathname]);
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ferme les dropdowns si clic en dehors
    useEffect(() => {
        const handler = (e) => {
            if (userDropRef.current && !userDropRef.current.contains(e.target)) setUserDropOpen(false);
            if (compDropRef.current && !compDropRef.current.contains(e.target)) setCompDropOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await api.post('/auth/logout');
        logout();
        setUserDropOpen(false);
        setMenuOpen(false);
        navigate('/');
        addToast('Vous avez été déconnecté', 'info');
    };

    const isStaff = user && ['moderator', 'admin', 'super_admin'].includes(user.role);

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <Link to="/" className="header-logo">⚽ MondialPronos</Link>

                    <nav className="header-main-nav">
                        <Link to="/" className="header-link">Accueil</Link>

                        {/* Dropdown Compétition */}
                        <div className="nav-dropdown" ref={compDropRef}>
                            <button
                                className="header-link nav-dropdown-btn"
                                onClick={() => setCompDropOpen(o => !o)}
                            >
                                Compétition <IconChevron />
                            </button>
                            {compDropOpen && (
                                <div className="nav-dropdown-menu">
                                    <Link to="/teams"     className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Équipes</Link>
                                    <Link to="/groups"    className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Groupes</Link>
                                    <Link to="/matches"   className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Matchs</Link>
                                    <Link to="/standings" className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Classements</Link>
                                    <Link to="/knockout"  className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Phases finales</Link>
                                    <Link to="/stadiums"  className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Stades</Link>
                                    <Link to="/statistics" className="nav-dropdown-item" onClick={() => setCompDropOpen(false)}>Statistiques</Link>
                                </div>
                            )}
                        </div>

                        <Link to="/news" className="header-link">Actus</Link>
                    </nav>
                </div>

                <div className="header-right">
                    {user ? (
                        <div className="header-user" ref={userDropRef}>
                            <button
                                className="header-user-btn"
                                onClick={() => setUserDropOpen(o => !o)}
                            >
                                {avatarSrc
                                    ? <img src={avatarSrc} alt="avatar" className="header-avatar" onError={() => setAvatarSrc(null)} />
                                    : <span className="header-avatar-placeholder">{user.username[0].toUpperCase()}</span>
                                }
                                <span className="header-username">{user.username}</span>
                                <IconChevron />
                            </button>

                            {userDropOpen && (
                                <div className="header-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setUserDropOpen(false)}>Mon profil</Link>
                                    <Link to="/leagues" className="dropdown-item" onClick={() => setUserDropOpen(false)}>Mes ligues</Link>
                                    <Link to="/predict" className="dropdown-item" onClick={() => setUserDropOpen(false)}>Mes pronos</Link>
                                    <Link to="/my-predictions" className="dropdown-item" onClick={() => setUserDropOpen(false)}>Mon historique</Link>
                                    {isStaff && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setUserDropOpen(false)}>Administration</Link>
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
                        <div className="mobile-nav-separator" />
                        <Link to="/teams"      className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Équipes</Link>
                        <Link to="/groups"     className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Groupes</Link>
                        <Link to="/matches"    className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Matchs</Link>
                        <Link to="/standings"  className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Classements</Link>
                        <Link to="/knockout"   className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Phases finales</Link>
                        <Link to="/stadiums"   className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Stades</Link>
                        <Link to="/statistics" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Statistiques</Link>
                        <div className="mobile-nav-separator" />
                        <Link to="/news" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Actus</Link>
                        {user && (
                            <>
                                <div className="mobile-nav-separator" />
                                <Link to="/profile" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Mon profil</Link>
                                <Link to="/leagues" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Mes ligues</Link>
                                <Link to="/predict" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Mes pronos</Link>
                                <Link to="/my-predictions" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Mon historique</Link>
                                {isStaff && <Link to="/admin" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Administration</Link>}
                                <button onClick={handleLogout} className="mobile-nav-item mobile-nav-danger">Déconnexion</button>
                            </>
                        )}
                        {!user && (
                            <>
                                <div className="mobile-nav-separator" />
                                <button onClick={() => { setModalOpen(true); setMenuOpen(false); }} className="mobile-nav-item">Connexion</button>
                            </>
                        )}
                    </nav>
                )}
            </header>

            {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
        </>
    );
}
