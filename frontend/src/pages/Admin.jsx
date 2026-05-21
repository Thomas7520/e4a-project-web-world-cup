import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Admin.css';

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, super_admin: 3 };

const ROLE_LABEL = {
    user: 'Utilisateur',
    moderator: 'Modérateur',
    admin: 'Admin',
    super_admin: 'Super-admin',
};

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconX = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function Admin() {
    const { user: me } = useAuth();
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch {
            addToast('Impossible de charger les utilisateurs', 'error');
        }
    };

    const handleToggleActive = async (u) => {
        try {
            await api.put(`/admin/users/${u.user_id}/disable`);
            addToast(u.is_active ? 'Compte désactivé' : 'Compte réactivé');
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const handleRoleChange = async (u, newRole) => {
        try {
            await api.put(`/admin/users/${u.user_id}/promote`, { role: newRole });
            addToast(`Rôle mis à jour : ${ROLE_LABEL[newRole]}`);
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const openEdit = (u) => {
        setEditUser(u);
        setEditUsername(u.username);
        setEditEmail(u.email);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editUser.user_id}`, { username: editUsername, email: editEmail });
            addToast('Utilisateur mis à jour');
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const canToggleActive = (u) =>
        u.user_id !== me.user_id &&
        ROLE_LEVEL[me.role] > ROLE_LEVEL[u.role];

    const canChangeRole = (u) =>
        u.user_id !== me.user_id &&
        ['admin', 'super_admin'].includes(me.role) &&
        ROLE_LEVEL[me.role] > ROLE_LEVEL[u.role];

    const availableRoles = (u) =>
        Object.keys(ROLE_LEVEL).filter(
            (r) => r !== 'super_admin' && ROLE_LEVEL[r] < ROLE_LEVEL[me.role] && r !== u.role
        );

    const canEdit = (u) =>
        u.user_id !== me.user_id &&
        ['admin', 'super_admin'].includes(me.role);

    return (
        <div className="page-content">
            <div className="admin-header">
                <h2>Administration - Utilisateurs</h2>
                <span className="admin-count">{users.length} utilisateur{users.length > 1 ? 's' : ''}</span>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Actif</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.user_id} className={!u.is_active ? 'inactive' : ''}>
                            <td>{u.user_id}</td>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                            <td>{u.is_active ? <IconCheck /> : <IconX />}</td>
                            <td className="admin-actions">
                                {canToggleActive(u) && (
                                    <button onClick={() => handleToggleActive(u)} className="btn btn-outline btn-sm">
                                        {u.is_active ? 'Désactiver' : 'Réactiver'}
                                    </button>
                                )}
                                {canChangeRole(u) && (
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u, e.target.value)}
                                        className="role-select"
                                    >
                                        <option value={u.role}>{ROLE_LABEL[u.role]}</option>
                                        {availableRoles(u).map((r) => (
                                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                                        ))}
                                    </select>
                                )}
                                {canEdit(u) && (
                                    <button onClick={() => openEdit(u)} className="btn btn-outline btn-sm">
                                        Modifier
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editUser && (
                <div className="modal-backdrop" onClick={() => setEditUser(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <h2>Modifier {editUser.username}</h2>
                            <div className="form-group">
                                <label>Nom d'utilisateur</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    required
                                    minLength={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                                <button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
