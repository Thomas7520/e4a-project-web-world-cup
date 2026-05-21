import { useState, useEffect } from 'react';
import api from '../services/api';
import './Admin.css';

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
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch {
            setError('Impossible de charger les utilisateurs');
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/disable`);
            fetchUsers();
        } catch {
            setError('Erreur lors de la modification');
        }
    };

    const handleToggleAdmin = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/promote`);
            fetchUsers();
        } catch {
            setError('Erreur lors de la modification');
        }
    };

    return (
        <div className="page-content">
            <div className="admin-header">
                <h2>Administration - Utilisateurs</h2>
                <span className="admin-count">{users.length} utilisateur{users.length > 1 ? 's' : ''}</span>
            </div>

            {error && <p className="msg-error" style={{ marginBottom: '16px' }}>{error}</p>}

            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom d'utilisateur</th>
                        <th>Email</th>
                        <th>Admin</th>
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
                            <td>{u.is_admin ? <IconCheck /> : null}</td>
                            <td>{u.is_active ? <IconCheck /> : <IconX />}</td>
                            <td className="admin-actions">
                                <button onClick={() => handleToggleActive(u.user_id)} className="btn btn-outline btn-sm">
                                    {u.is_active ? 'Désactiver' : 'Réactiver'}
                                </button>
                                <button onClick={() => handleToggleAdmin(u.user_id)} className="btn btn-outline btn-sm">
                                    {u.is_admin ? 'Rétrograder' : 'Promouvoir'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
