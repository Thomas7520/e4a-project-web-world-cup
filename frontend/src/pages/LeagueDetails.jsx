import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './LeagueDetails.css';

function rankClass(index) {
    if (index === 0) return 'ld-rank ld-rank--gold';
    if (index === 1) return 'ld-rank ld-rank--silver';
    if (index === 2) return 'ld-rank ld-rank--bronze';
    return 'ld-rank';
}

export default function LeagueDetails() {
    const [searchParams] = useSearchParams();
    const leagueId = searchParams.get('id');

    const [league, setLeague] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeagueData = async () => {
            if (!leagueId) return;
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/leagues/${leagueId}`);
                setLeague(response.data.league);
                setLeaderboard(response.data.leaderboard || []);
            } catch {
                setError('Impossible de charger le classement de cette ligue.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeagueData();
    }, [leagueId]);

    if (loading) return <div className="ld-loading">Chargement du classement...</div>;

    return (
        <div className="ld-shell">
            {error && <div className="ld-error">{error}</div>}

            {league && (
                <div className="ld-hero">
                    <div>
                        <h1 className="ld-hero-title">{league.name}</h1>
                        <p className="ld-hero-meta">
                            Créée par <strong>{league.owner_name}</strong>
                            {league.created_at && (
                                <> · {new Date(league.created_at).toLocaleDateString('fr-FR')}</>
                            )}
                        </p>
                    </div>
                    <div className="ld-hero-code">
                        <span className="ld-code-label">Code d'invitation</span>
                        <span className="ld-code-value">{league.invite_code}</span>
                    </div>
                </div>
            )}

            <div className="ld-table-wrap">
                <table className="ld-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Joueur</th>
                            <th className="ld-center">Pronos</th>
                            <th className="ld-center">Scores exacts</th>
                            <th className="ld-points">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="ld-empty">Aucun joueur dans cette ligue.</td>
                            </tr>
                        ) : (
                            leaderboard.map((player, index) => (
                                <tr key={player.user_id}>
                                    <td className={rankClass(index)}>{index + 1}</td>
                                    <td>
                                        <div className="ld-player">
                                            {player.avatar_url ? (
                                                <img src={player.avatar_url} alt="" className="ld-avatar" />
                                            ) : (
                                                <div className="ld-avatar-placeholder">
                                                    {player.username?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className="ld-username">{player.username}</span>
                                        </div>
                                    </td>
                                    <td className="ld-center">{player.predictions_count}</td>
                                    <td className="ld-center ld-exact">{player.exact_scores_count}</td>
                                    <td className="ld-points">{player.total_points} pts</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
