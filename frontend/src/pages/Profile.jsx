import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, login } = useAuth();
    const { addToast } = useToast();
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/me', { username, email, avatar_url: avatarUrl });
            login(localStorage.getItem('token'), res.data.user);
            addToast('Profil mis à jour avec succès');
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return addToast('Les mots de passe ne correspondent pas', 'error');
        }
        try {
            await api.put('/users/me/password', { currentPassword, newPassword });
            addToast('Mot de passe mis à jour');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur lors du changement de mot de passe', 'error');
        }
    };

    return (
        <div className="profile-page">
            <form onSubmit={handleSubmit} className="form-card">
                <div className="profile-avatar-section">
                    {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="profile-avatar" />
                        : <div className="profile-avatar-placeholder">{user?.username[0].toUpperCase()}</div>
                    }
                    <h2>{user?.username}</h2>
                    <p className="profile-email">{user?.email}</p>
                </div>

                <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>URL de l'avatar</label>
                    <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>

                <button type="submit" className="btn btn-primary">Enregistrer</button>
            </form>

            <form onSubmit={handlePasswordSubmit} className="form-card">
                <h2>Changer le mot de passe</h2>

                <div className="form-group">
                    <label>Mot de passe actuel</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <p className="field-hint">8 caractères minimum, une majuscule et un caractère spécial</p>
                </div>

                <div className="form-group">
                    <label>Confirmer le nouveau mot de passe</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">Changer le mot de passe</button>
            </form>
        </div>
    );
}
