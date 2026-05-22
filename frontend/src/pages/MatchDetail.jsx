import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, stageLabel, statusLabel } from '../utils/formatters';
import './WorldCupPages.css';

const renderScore = (match) => {
    if (match.home_score === null || match.away_score === null) return 'vs';
    return `${match.home_score} - ${match.away_score}`;
};

const eventLabel = {
    goal: 'But',
    assist: 'Passe decisive',
    yellow_card: 'Carton jaune',
    red_card: 'Carton rouge',
    substitution: 'Remplacement',
    penalty: 'Penalty',
};

export default function MatchDetail() {
    const { id } = useParams();
    const { addToast } = useToast();
    const [match, setMatch] = useState(null);
    const [events, setEvents] = useState([]);
    const [referees, setReferees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatch = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/matches/${id}`);
                setMatch(res.data.match);
                setEvents(res.data.events);
                setReferees(res.data.referees);
            } catch (err) {
                addToast(err.response?.data?.message || 'Impossible de charger ce match', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMatch();
    }, [id]);

    if (loading) {
        return <div className="page-content"><div className="wc-loading">Chargement du match...</div></div>;
    }

    if (!match) {
        return <div className="page-content"><div className="wc-empty">Match introuvable.</div></div>;
    }

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Match {match.match_number}</h1>
                        <p>{stageLabel[match.stage] || match.stage} · Groupe {match.group_name || '-'}</p>
                    </div>
                    <Link className="btn btn-outline" to="/matches">Retour au calendrier</Link>
                </div>

                <section className="wc-match-detail">
                    <Link className="wc-match-detail-team" to={`/teams/${match.home_team_id}`}>
                        <img src={match.home_flag_url} alt="" className="wc-flag wc-flag-lg" />
                        <div>
                            <h2>{match.home_team_name}</h2>
                            <div className="wc-meta">{match.home_team_code}</div>
                        </div>
                    </Link>

                    <div className="wc-match-score">{renderScore(match)}</div>

                    <Link className="wc-match-detail-team" to={`/teams/${match.away_team_id}`}>
                        <div>
                            <h2>{match.away_team_name}</h2>
                            <div className="wc-meta">{match.away_team_code}</div>
                        </div>
                        <img src={match.away_flag_url} alt="" className="wc-flag wc-flag-lg" />
                    </Link>
                </section>

                <section className="wc-info-grid">
                    <div className="wc-info-item">
                        <span className="wc-info-label">Date</span>
                        <span className="wc-info-value">{formatDateTime(match.kickoff_at)}</span>
                    </div>
                    <div className="wc-info-item">
                        <span className="wc-info-label">Statut</span>
                        <span className="wc-info-value">{statusLabel[match.status] || match.status}</span>
                    </div>
                    <div className="wc-info-item">
                        <span className="wc-info-label">Stade</span>
                        <span className="wc-info-value">{match.stadium_name || '-'} · {match.stadium_city || '-'}</span>
                    </div>
                </section>

                <section className="wc-section">
                    <h2>Evenements</h2>
                    {events.length === 0 ? (
                        <div className="wc-empty">Aucun evenement enregistre pour ce match.</div>
                    ) : (
                        <div className="wc-table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Minute</th>
                                        <th>Type</th>
                                        <th>Equipe</th>
                                        <th>Joueur</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event.event_id}>
                                            <td>{event.minute}'</td>
                                            <td>{eventLabel[event.event_type] || event.event_type}</td>
                                            <td>{event.team_name}</td>
                                            <td>{event.player_name || '-'}</td>
                                            <td>{event.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="wc-section">
                    <h2>Arbitres</h2>
                    {referees.length === 0 ? (
                        <div className="wc-empty">Aucun arbitre renseigne.</div>
                    ) : (
                        <div className="wc-grid">
                            {referees.map((referee) => (
                                <div className="wc-card" key={`${referee.referee_id}-${referee.role}`}>
                                    <strong>{referee.full_name}</strong>
                                    <div className="wc-meta">{referee.role} · {referee.nationality || '-'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
