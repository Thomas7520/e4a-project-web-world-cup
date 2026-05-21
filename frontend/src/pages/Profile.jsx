import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, login } = useAuth();
    const { addToast } = useToast();
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
    const [pendingFile, setPendingFile] = useState(null);
    const fileInputRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleAvatarDelete = async () => {
        setPendingFile(null);
        setAvatarPreview(null);
        if (user?.avatar_url) {
            try {
                await api.delete('/users/me/avatar');
                login(localStorage.getItem('token'), { ...user, avatar_url: null });
                addToast('Avatar supprimé');
            } catch (err) {
                addToast(err.response?.data?.message || "Erreur lors de la suppression", 'error');
                setAvatarPreview(user?.avatar_url);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (pendingFile) {
                const formData = new FormData();
                formData.append('avatar', pendingFile);
                const avatarRes = await api.put('/users/me/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                login(localStorage.getItem('token'), { ...user, avatar_url: avatarRes.data.avatar_url });
                setPendingFile(null);
            }
            const res = await api.put('/users/me', { username, email });
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
                    <div
                        className="profile-avatar-wrapper"
                        onClick={() => fileInputRef.current.click()}
                        title="Changer l'avatar"
                    >
                        {avatarPreview
                            ? <img
                                src={avatarPreview}
                                alt="avatar"
                                className="profile-avatar"
                                onError={() => setAvatarPreview(null)}
                              />
                            : <div className="profile-avatar-placeholder">{user?.username[0].toUpperCase()}</div>
                        }
                        <div className="profile-avatar-overlay">📷</div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                    {avatarPreview && (
                        <button
                            type="button"
                            className="btn-avatar-delete"
                            onClick={handleAvatarDelete}
                        >
                            Supprimer l'avatar
                        </button>
                    )}
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
