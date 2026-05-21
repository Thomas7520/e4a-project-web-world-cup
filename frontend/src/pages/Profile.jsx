import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, login } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await api.put('/users/me', { username, avatar_url: avatarUrl });
            login(localStorage.getItem('token'), res.data.user);
            setSuccess('Profil mis à jour avec succès');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    return (
        <div className="form-page">
            <form onSubmit={handleSubmit} className="form-card">
                <div className="profile-avatar-section">
                    {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="profile-avatar" />
                        : <div className="profile-avatar-placeholder">{user?.username[0].toUpperCase()}</div>
                    }
                    <h2>{user?.username}</h2>
                    <p className="profile-email">{user?.email}</p>
                </div>

                {error && <p className="msg-error">{error}</p>}
                {success && <p className="msg-success">{success}</p>}

                <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>URL de l'avatar</label>
                    <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>

                <button type="submit" className="btn btn-primary">Enregistrer</button>
            </form>
        </div>
    );
}
