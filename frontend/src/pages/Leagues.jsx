import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './Leagues.css';

export default function Leagues() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [leagues, setLeagues] = useState([]);
    const [newLeagueName, setNewLeagueName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMyLeagues = async () => {
        try {
            setLoading(true);
            const response = await api.get('/leagues/me');
            setLeagues(response.data);
        } catch {
            addToast('Impossible de charger vos ligues.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyLeagues(); }, []);

    const handleCreateLeague = async (e) => {
        e.preventDefault();
        if (!newLeagueName.trim()) return addToast('Donne un nom à ta ligue.', 'error');
        try {
            await api.post('/leagues', { name: newLeagueName.trim() });
            addToast('Ligue créée avec succès !', 'success');
            setNewLeagueName('');
            fetchMyLeagues();
        } catch (err) {
            addToast(err.response?.data?.error || 'Impossible de créer la ligue.', 'error');
        }
    };

    const handleJoinLeague = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return addToast("Entre un code d'invitation.", 'error');
        try {
            await api.post('/leagues/join', { invite_code: inviteCode.trim().toUpperCase() });
            addToast('Ligue rejointe !', 'success');
            setInviteCode('');
            fetchMyLeagues();
        } catch (err) {
            addToast(err.response?.data?.error || 'Code invalide ou ligue déjà rejointe.', 'error');
        }
    };

    return (
        <div className="lg-shell">
            <h1 className="lg-title">Mes ligues privées</h1>

            <div className="lg-actions">
                <div className="lg-card">
                    <h2 className="lg-card-title">Créer une ligue</h2>
                    <form className="lg-form" onSubmit={handleCreateLeague}>
                        <input
                            className="lg-input"
                            type="text"
                            placeholder="Nom de la ligue"
                            value={newLeagueName}
                            onChange={(e) => setNewLeagueName(e.target.value)}
                        />
                        <button type="submit" className="lg-btn lg-btn--create">Créer</button>
                    </form>
                </div>

                <div className="lg-card">
                    <h2 className="lg-card-title">Rejoindre une ligue</h2>
                    <form className="lg-form" onSubmit={handleJoinLeague}>
                        <input
                            className="lg-input"
                            type="text"
                            placeholder="Code d'invitation (ex : A1B2C3D4)"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            maxLength="8"
                        />
                        <button type="submit" className="lg-btn lg-btn--join">Rejoindre</button>
                    </form>
                </div>
            </div>

            <section>
                <h2 className="lg-section-title">
                    Mes ligues ({leagues.length})
                </h2>

                {loading ? (
                    <p className="lg-loading">Chargement...</p>
                ) : leagues.length === 0 ? (
                    <p className="lg-empty">Tu ne fais partie d'aucune ligue. Crée-en une ou rejoins-en une.</p>
                ) : (
                    <div className="lg-list">
                        {leagues.map(league => (
                            <div key={league.league_id} className="lg-league-card">
                                <div className="lg-league-info">
                                    <h3 className="lg-league-name">{league.name}</h3>
                                    <span className="lg-league-meta">
                                        {league.member_count ?? 1} membre{league.member_count !== 1 ? 's' : ''} · Créée le{' '}
                                        {league.created_at ? new Date(league.created_at).toLocaleDateString('fr-FR') : '—'}
                                    </span>
                                </div>
                                <div className="lg-league-right">
                                    <div className="lg-invite-code">
                                        <span className="lg-invite-label">Code</span>
                                        {league.invite_code}
                                    </div>
                                    <button
                                        className="lg-btn lg-btn--view"
                                        onClick={() => navigate(`/league-details?id=${league.league_id}`)}
                                    >
                                        Classement
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
