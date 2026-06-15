import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [predictions, setPredictions] = useState({});
    const [submitting, setSubmitting] = useState({});

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }

        api.get('/dashboard')
            .then(res => setData(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [user, authLoading]);

    const handleScoreChange = (matchId, team, value) => {
        setPredictions(prev => ({
            ...prev,
            [matchId]: { ...prev[matchId], [team]: value === '' ? '' : parseInt(value) || 0 },
        }));
    };

    const handlePredictionSubmit = async (e, matchId) => {
        e.preventDefault();
        const prono = predictions[matchId];
        if (!prono || prono.home === undefined || prono.away === undefined || prono.home === '' || prono.away === '') {
            return;
        }
        setSubmitting(s => ({ ...s, [matchId]: true }));
        try {
            await api.post('/predictions', {
                match_id: matchId,
                predicted_home_score: prono.home,
                predicted_away_score: prono.away,
            });

            setData(prev => ({
                ...prev,
                pendingMatches: prev.pendingMatches.filter(m => m.match_id !== matchId),
            }));
            setPredictions(prev => { const n = { ...prev }; delete n[matchId]; return n; });
        } catch {
            // Rien
        } finally {
            setSubmitting(s => ({ ...s, [matchId]: false }));
        }
    };

    if (authLoading || loading) return <div className="db-loading">Chargement du tableau de bord...</div>;

    if (!user) return (
        <div className="db-welcome">
            <h1>Bienvenue sur la Coupe du Monde 2026</h1>
            <p>Connectez-vous pour accéder à votre tableau de bord personnalisé.</p>
        </div>
    );

    if (error) return <div className="db-error">Impossible de charger le tableau de bord. Vérifie que le serveur est démarré.</div>;

    const { userSummary, globalStats, upcomingMatches, pendingMatches, latestNews } = data;

    return (
        <div className="db-shell">

            {/* Résumé utilisateur */}
            <section className="db-hero">
                <div className="db-hero-left">
                    <h2>Bonjour, {userSummary?.username} !</h2>
                    <p>Voici un résumé de votre activité sur la compétition.</p>
                </div>
                <div className="db-hero-stats">
                    <div className="db-stat-card">
                        <span className="db-stat-value">{userSummary?.totalPoints ?? 0}</span>
                        <span className="db-stat-label">Points</span>
                    </div>
                    <div className="db-stat-card">
                        <span className="db-stat-value">#{userSummary?.globalRank ?? '—'}</span>
                        <span className="db-stat-label">Classement</span>
                    </div>
                    <div className="db-stat-card">
                        <span className="db-stat-value">{userSummary?.activeLeaguesCount ?? 0}</span>
                        <span className="db-stat-label">Ligues</span>
                    </div>
                </div>
            </section>

            {/* Stats globales de la compétition */}
            <section className="db-section">
                <h3 className="db-section-title">Statistiques de la compétition</h3>
                <div className="db-global-stats">
                    <div className="db-global-card">
                        <span className="db-global-icon">⚽</span>
                        <div>
                            <div className="db-global-value">{globalStats?.matchesPlayed ?? 0}</div>
                            <div className="db-global-label">Matchs joués</div>
                        </div>
                    </div>
                    <div className="db-global-card">
                        <span className="db-global-icon">🥇</span>
                        <div>
                            <div className="db-global-value">{globalStats?.topScorer?.full_name ?? '—'}</div>
                            <div className="db-global-label">Top buteur · {globalStats?.topScorer?.goals ?? 0} buts</div>
                        </div>
                    </div>
                    <div className="db-global-card">
                        <span className="db-global-icon">🏆</span>
                        <div>
                            <div className="db-global-value">{globalStats?.topForecaster?.username ?? '—'}</div>
                            <div className="db-global-label">Top pronostiqueur · {globalStats?.topForecaster?.points ?? 0} pts</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="db-grid">

                {/* Pronos en attente */}
                <section className="db-section">
                    <div className="db-section-header">
                        <h3 className="db-section-title">Mes pronos en attente</h3>
                    </div>
                    {pendingMatches?.length === 0 ? (
                        <p className="db-empty">Tous les matchs ont été pronostiqués.</p>
                    ) : (
                        pendingMatches?.map(match => (
                            <form
                                key={match.match_id}
                                className="db-match-card"
                                onSubmit={(e) => handlePredictionSubmit(e, match.match_id)}
                            >
                                <div className="db-match-meta">
                                    <span>{match.stage}</span>
                                    <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleDateString('fr-FR') : 'À venir'}</span>
                                </div>
                                <div className="db-match-row">
                                    <span className="db-team">{match.home_team_name}</span>
                                    <input
                                        type="number" min="0" max="99"
                                        className="db-score-input"
                                        value={predictions[match.match_id]?.home ?? ''}
                                        onChange={(e) => handleScoreChange(match.match_id, 'home', e.target.value)}
                                    />
                                    <span className="db-vs">–</span>
                                    <input
                                        type="number" min="0" max="99"
                                        className="db-score-input"
                                        value={predictions[match.match_id]?.away ?? ''}
                                        onChange={(e) => handleScoreChange(match.match_id, 'away', e.target.value)}
                                    />
                                    <span className="db-team db-team--right">{match.away_team_name}</span>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={submitting[match.match_id]}
                                    >
                                        {submitting[match.match_id] ? '...' : 'Valider'}
                                    </button>
                                </div>
                            </form>
                        ))
                    )}
                </section>

                {/* Dernières actus */}
                <aside className="db-section">
                    <div className="db-section-header">
                        <h3 className="db-section-title">Dernières actualités</h3>
                        <Link to="/news" className="db-section-link">Toutes les actus →</Link>
                    </div>
                    {latestNews?.length === 0 ? (
                        <p className="db-empty">Aucune actualité pour le moment.</p>
                    ) : (
                        latestNews?.map(item => (
                            <div key={item.news_id} className="db-news-card">
                                <h4>{item.title}</h4>
                                <p>{item.content}</p>
                            </div>
                        ))
                    )}
                </aside>

            </div>

            {/* Prochains matchs */}
            <section className="db-section">
                <h3 className="db-section-title">Prochains matchs</h3>
                <div className="db-upcoming-list">
                    {upcomingMatches?.length === 0 ? (
                        <p className="db-empty">Aucun match à venir.</p>
                    ) : (
                        upcomingMatches?.map(match => (
                            <div key={match.match_id} className="db-upcoming-card">
                                <span className="db-upcoming-stage">{match.stage}</span>
                                <span className="db-upcoming-teams">{match.home_team_name} vs {match.away_team_name}</span>
                                <span className="db-upcoming-date">
                                    {match.kickoff_at ? new Date(match.kickoff_at).toLocaleDateString('fr-FR') : 'À venir'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </section>

        </div>
    );
}
