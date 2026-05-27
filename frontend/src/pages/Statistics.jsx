import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './WorldCupPages.css';

export default function Statistics() {
    const { addToast } = useToast();
    const [competition, setCompetition] = useState(null);
    const [competitions, setCompetitions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCompetition, setSelectedCompetition] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const competitionResponse = await api.get('/competitions');
                const competitionList = competitionResponse.data.competitions || [];

                if (!competitionList.length) {
                    throw new Error('Aucune compétition trouvée');
                }

                setCompetitions(competitionList);
                setSelectedCompetition(competitionList[0].competition_id);
                setCompetition(competitionList[0]);
            } catch (error) {
                console.error(error);
                addToast('Impossible de charger les compétitions', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [addToast]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedCompetition) return;

            setLoading(true);
            try {
                const current = competitions.find((c) => c.competition_id === selectedCompetition);
                setCompetition(current || null);

                const statsResponse = await api.get(`/stats/competition/${selectedCompetition}`);
                setStats(statsResponse.data.stats);
            } catch (error) {
                console.error(error);
                addToast('Impossible de charger les statistiques', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedCompetition, addToast, competitions]);

    const handleCompetitionChange = (event) => {
        setSelectedCompetition(Number(event.target.value));
    };

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Statistiques</h1>
                        <p>Découvrez les meilleurs buteurs, passeurs, équipes et cartes de la compétition.</p>
                    </div>
                    <span className="wc-count" translate="no">{competitions.length} compétitions</span>
                </div>

                <div className="wc-toolbar">
                    <select value={selectedCompetition || ''} onChange={handleCompetitionChange} className="wc-select">
                        {competitions.map((comp) => (
                            <option key={comp.competition_id} value={comp.competition_id}>
                                {comp.name} {comp.year}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des statistiques...</div>
                ) : !stats ? (
                    <div className="wc-empty">Aucune statistique disponible.</div>
                ) : (
                    <>
                        <div className="wc-detail-head">
                            <div>
                                <h1>{competition?.name} {competition?.year}</h1>
                                <p>Les chiffres clés de la compétition sont présentés ci-dessous.</p>
                            </div>
                        </div>

                        <div className="wc-stat-grid">
                            <section className="wc-card wc-stat-panel">
                                <h3>Meilleurs buteurs</h3>
                                <ul className="wc-stat-list">
                                    {stats.top_scorers.map((player) => (
                                        <li key={player.player_id}>
                                            <div className="wc-stat-team">
                                                {player.flag_url && <img src={player.flag_url} alt={player.team_name} />}
                                                <div>
                                                    <strong>{player.full_name}</strong>
                                                    <div className="wc-meta">{player.team_name}</div>
                                                </div>
                                            </div>
                                            <span>{player.goals}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="wc-card wc-stat-panel">
                                <h3>Meilleurs passeurs</h3>
                                <ul className="wc-stat-list">
                                    {stats.top_assists.map((player) => (
                                        <li key={player.player_id}>
                                            <div className="wc-stat-team">
                                                {player.flag_url && <img src={player.flag_url} alt={player.team_name} />}
                                                <div>
                                                    <strong>{player.full_name}</strong>
                                                    <div className="wc-meta">{player.team_name}</div>
                                                </div>
                                            </div>
                                            <span>{player.assists}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="wc-card wc-stat-panel">
                                <h3>Cartons jaunes</h3>
                                <ul className="wc-stat-list">
                                    {stats.cards.yellow_cards.map((player) => (
                                        <li key={player.player_id}>
                                            <div className="wc-stat-team">
                                                {player.flag_url && <img src={player.flag_url} alt={player.team_name} />}
                                                <div>
                                                    <strong>{player.full_name}</strong>
                                                    <div className="wc-meta">{player.team_name}</div>
                                                </div>
                                            </div>
                                            <span>{player.yellow_cards}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="wc-card wc-stat-panel">
                                <h3>Cartons rouges</h3>
                                <ul className="wc-stat-list">
                                    {stats.cards.red_cards.map((player) => (
                                        <li key={player.player_id}>
                                            <div className="wc-stat-team">
                                                {player.flag_url && <img src={player.flag_url} alt={player.team_name} />}
                                                <div>
                                                    <strong>{player.full_name}</strong>
                                                    <div className="wc-meta">{player.team_name}</div>
                                                </div>
                                            </div>
                                            <span>{player.red_cards}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        <section className="wc-card wc-stat-panel" style={{ marginTop: 16 }}>
                            <h3>Comparatif par équipe</h3>
                            <div className="wc-table-wrapper">
                                <table className="wc-stat-table">
                                    <thead>
                                        <tr>
                                            <th>Equipe</th>
                                            <th>Buts</th>
                                            <th>Passes</th>
                                            <th>Jaunes</th>
                                            <th>Rouges</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.team_stats.map((team) => (
                                            <tr key={team.team_id}>
                                                <td>{team.name}</td>
                                                <td>{team.total_goals}</td>
                                                <td>{team.total_assists}</td>
                                                <td>{team.total_yellow_cards}</td>
                                                <td>{team.total_red_cards}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
