import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, positionLabel, stageLabel, statusLabel } from '../utils/formatters';
import './WorldCupPages.css';

const renderScore = (match) => {
    if (match.home_score === null || match.away_score === null) return 'vs';
    return `${match.home_score} - ${match.away_score}`;
};

export default function TeamDetail() {
    const { id } = useParams();
    const { addToast } = useToast();
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/teams/${id}`);
                setTeam(res.data.team);
                setPlayers(res.data.players);
                setMatches(res.data.matches);
            } catch (err) {
                addToast(err.response?.data?.message || 'Impossible de charger cette equipe', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, [id]);

    if (loading) {
        return <div className="page-content"><div className="wc-loading">Chargement de l'equipe...</div></div>;
    }

    if (!team) {
        return <div className="page-content"><div className="wc-empty">Equipe introuvable.</div></div>;
    }

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-detail-head">
                    <img src={team.flag_url} alt="" className="wc-flag wc-flag-lg" />
                    <div>
                        <h1>{team.name}</h1>
                        <div className="wc-meta">Groupe {team.group_name || '-'} · {team.fifa_code} · {team.confederation || '-'}</div>
                    </div>
                    <div className="wc-detail-actions">
                        <Link className="btn btn-outline" to="/teams">Retour aux equipes</Link>
                    </div>
                </div>

                <section className="wc-section">
                    <h2>Joueurs</h2>
                    <div className="wc-table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nom</th>
                                    <th>Poste</th>
                                    <th>Club</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.player_id}>
                                        <td>{player.shirt_number || '-'}</td>
                                        <td>{player.full_name}</td>
                                        <td>{positionLabel[player.position] || player.position}</td>
                                        <td>{player.club || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="wc-section">
                    <h2>Matchs</h2>
                    {matches.length === 0 ? (
                        <div className="wc-empty">Aucun match rattache a cette equipe.</div>
                    ) : (
                        <div className="wc-match-list">
                            {matches.map((match) => (
                                <Link to={`/matches/${match.match_id}`} className="wc-card wc-match-row" key={match.match_id}>
                                    <div className="wc-meta">{formatDateTime(match.kickoff_at)}</div>
                                    <div className="wc-match-team">
                                        <img src={match.home_flag_url} alt="" className="wc-flag" />
                                        <span>{match.home_team_name}</span>
                                    </div>
                                    <div className="wc-score">{renderScore(match)}</div>
                                    <div className="wc-match-team">
                                        <img src={match.away_flag_url} alt="" className="wc-flag" />
                                        <span>{match.away_team_name}</span>
                                    </div>
                                    <div className="wc-meta">
                                        {stageLabel[match.stage] || match.stage} · {statusLabel[match.status] || match.status}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
