import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './WorldCupPages.css';

export default function Groups() {
    const { addToast } = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await api.get('/groups');
                setGroups(res.data.groups);
            } catch {
                addToast('Impossible de charger les groupes', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Groupes</h1>
                        <p>Format Coupe du Monde 2026 : 12 groupes de 4 equipes.</p>
                    </div>
                    <span className="wc-count">{groups.length} groupes</span>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des groupes...</div>
                ) : groups.length === 0 ? (
                    <div className="wc-empty">Aucun groupe disponible.</div>
                ) : (
                    <div className="wc-group-grid">
                        {groups.map((group) => (
                            <section className="wc-card wc-group-card" key={group.group_id}>
                                <h2>Groupe {group.name}</h2>
                                {group.teams.map((team) => (
                                    <Link to={`/teams/${team.team_id}`} className="wc-group-team" key={team.team_id}>
                                        <img src={team.flag_url} alt="" className="wc-flag" />
                                        <div>
                                            <h3>{team.name}</h3>
                                            <div className="wc-meta">{team.fifa_code} · {team.confederation || '-'}</div>
                                        </div>
                                    </Link>
                                ))}
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
