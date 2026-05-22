import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './WorldCupPages.css';

export default function Teams() {
    const { addToast } = useToast();
    const [teams, setTeams] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/teams');
                setTeams(res.data.teams);
            } catch {
                addToast('Impossible de charger les equipes', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const visibleTeamIds = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return new Set(teams.map((team) => team.team_id));

        return new Set(
            teams
                .filter((team) => (
                    team.name.toLowerCase().includes(term) ||
                    team.fifa_code.toLowerCase().includes(term) ||
                    team.group_name?.toLowerCase().includes(term) ||
                    team.confederation?.toLowerCase().includes(term)
                ))
                .map((team) => team.team_id)
        );
    }, [search, teams]);

    const visibleCount = visibleTeamIds.size;
    const visibleCountLabel = `${visibleCount} ${visibleCount > 1 ? 'equipes' : 'equipe'}`;

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Equipes</h1>
                        <p>Les 48 selections qualifiees, classees par groupe.</p>
                    </div>
                    <span className="wc-count" translate="no">{visibleCountLabel}</span>
                </div>

                <div className="wc-toolbar">
                    <div className="form-group">
                        <label>Rechercher</label>
                        <input
                            type="search"
                            value={search}
                            placeholder="Nom, groupe ou code FIFA"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des equipes...</div>
                ) : (
                    <>
                        {visibleCount === 0 && (
                            <div className="wc-empty">Aucune equipe ne correspond a cette recherche.</div>
                        )}

                        <div className="wc-grid">
                            {teams.map((team) => {
                                const isVisible = visibleTeamIds.has(team.team_id);

                                return (
                                    <Link
                                        to={`/teams/${team.team_id}`}
                                        className={`wc-card wc-team-card${isVisible ? '' : ' wc-filter-hidden'}`}
                                        key={team.team_id}
                                        aria-hidden={!isVisible}
                                        tabIndex={isVisible ? undefined : -1}
                                    >
                                        <img src={team.flag_url} alt="" className="wc-flag" />
                                        <div>
                                            <h2>{team.name}</h2>
                                            <div className="wc-meta">
                                                Groupe {team.group_name || '-'} - {team.fifa_code} - {team.confederation || '-'}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
