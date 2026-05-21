import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

export default function AuthModal({ onClose }) {
    const [tab, setTab] = useState('login');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [username, setUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { login } = useAuth();
    const { addToast } = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword, rememberMe });
            login(res.data.token, res.data.user);
            onClose();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur de connexion', 'error');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return addToast('Les mots de passe ne correspondent pas', 'error');
        }
        try {
            await api.post('/auth/register', { username, email: regEmail, password });
            addToast('Compte créé ! Tu peux maintenant te connecter.');
            setTimeout(() => setTab('login'), 1000);
        } catch (err) {
            const data = err.response?.data;
            addToast(data?.message || data?.errors?.[0]?.msg || "Erreur lors de l'inscription", 'error');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-tabs">
                    <button
                        className={`modal-tab${tab === 'login' ? ' active' : ''}`}
                        onClick={() => setTab('login')}
                    >
                        Se connecter
                    </button>
                    <button
                        className={`modal-tab${tab === 'register' ? ' active' : ''}`}
                        onClick={() => setTab('register')}
                    >
                        S'inscrire
                    </button>
                </div>

                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="modal-form">
                        <h2>Connexion</h2>
                        <div className="form-group">
                            <label>Adresse Email</label>
                            <input
                                type="email"
                                placeholder="exemple@mail.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mot de passe</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Rester connecté pendant 7 jours
                        </label>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Se connecter
                        </button>
                    </form>
                )}

                {tab === 'register' && (
                    <form onSubmit={handleRegister} className="modal-form">
                        <h2>Inscription</h2>
                        <div className="form-group">
                            <label>Nom d'utilisateur</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Créer un compte
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
