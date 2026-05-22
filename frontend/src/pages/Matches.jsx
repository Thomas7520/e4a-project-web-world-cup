import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, stageLabel, statusLabel } from '../utils/formatters';
import './WorldCupPages.css';

const renderScore = (match) => {
    if (match.home_score === null || match.away_score === null) return 'vs';
    return `${match.home_score} - ${match.away_score}`;
};

export default function Matches() {
    const { addToast } = useToast();
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [filters, setFilters] = useState({ date: '', team_id: '', stage: '', status: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/teams');
                setTeams(res.data.teams);
            } catch {
                addToast('Impossible de charger les equipes', 'error');
            }
        };

        fetchTeams();
    }, []);

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            try {
                const params = Object.fromEntries(
                    Object.entries(filters).filter(([, value]) => value)
                );
                const res = await api.get('/matches', { params });
                setMatches(res.data.matches);
            } catch {
                addToast('Impossible de charger les matchs', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [filters]);

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ date: '', team_id: '', stage: '', status: '' });
    };

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Calendrier des matchs</h1>
                        <p>Matchs de groupes filtrables par date, equipe, phase et statut.</p>
                    </div>
                    <span className="wc-count">{matches.length} match{matches.length > 1 ? 's' : ''}</span>
                </div>

                <div className="wc-toolbar">
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => updateFilter('date', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Equipe</label>
                        <select value={filters.team_id} onChange={(e) => updateFilter('team_id', e.target.value)}>
                            <option value="">Toutes</option>
                            {teams.map((team) => (
                                <option key={team.team_id} value={team.team_id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Phase</label>
                        <select value={filters.stage} onChange={(e) => updateFilter('stage', e.target.value)}>
                            <option value="">Toutes</option>
                            <option value="group">Phase de groupes</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Statut</label>
                        <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                            <option value="">Tous</option>
                            <option value="scheduled">Planifie</option>
                            <option value="live">En direct</option>
                            <option value="finished">Termine</option>
                            <option value="postponed">Reporte</option>
                        </select>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={resetFilters}>
                        Reinitialiser
                    </button>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des matchs...</div>
                ) : matches.length === 0 ? (
                    <div className="wc-empty">Aucun match ne correspond aux filtres.</div>
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
                                    Groupe {match.group_name || '-'} · {stageLabel[match.stage] || match.stage} · {statusLabel[match.status] || match.status}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
