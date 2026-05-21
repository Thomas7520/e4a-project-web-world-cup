import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            return setError('Les mots de passe ne correspondent pas');
        }

        try {
            await api.post('/auth/register', { username, email, password });
            setSuccess('Compte créé avec succès ! Redirection...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || data?.errors?.[0]?.msg || "Erreur lors de l'inscription");
        }
    };

    return (
        <div className="form-page">
            <form onSubmit={handleSubmit} className="form-card">
                <h2>Inscription</h2>

                {error && <p className="msg-error">{error}</p>}
                {success && <p className="msg-success">{success}</p>}

                <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary">Créer un compte</button>

                <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                    Déjà un compte ? <Link to="/login">Se connecter</Link>
                </p>
            </form>
        </div>
    );
}
