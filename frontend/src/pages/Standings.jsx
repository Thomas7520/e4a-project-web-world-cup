import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './WorldCupPages.css';

export default function Standings() {
    const { addToast } = useToast();
    const [competition, setCompetition] = useState(null);
    const [standings, setStandings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStandings = async () => {
            try {
                const competitionResponse = await api.get('/competitions');
                const competitionList = competitionResponse.data.competitions || [];
                if (!competitionList.length) {
                    throw new Error('Aucune compétition trouvée');
                }

                const currentCompetition = competitionList[0];
                setCompetition(currentCompetition);

                const standingsResponse = await api.get(`/standings/competition/${currentCompetition.competition_id}`);
                setStandings(standingsResponse.data.standings || {});
            } catch (error) {
                addToast('Impossible de charger les classements', 'error');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [addToast]);

    const groupNames = Object.keys(standings).sort();
    const totalGroups = groupNames.length;
    const totalTeams = groupNames.reduce((sum, group) => sum + (standings[group]?.length || 0), 0);

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Classements</h1>
                        <p>Suivez les résultats de groupe avec points, victoires, nuls, défaites, buts et différence.</p>
                    </div>
                    <span className="wc-count" translate="no">{totalGroups} groupes • {totalTeams} équipes</span>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des classements...</div>
                ) : !competition ? (
                    <div className="wc-empty">Aucun classement disponible pour le moment.</div>
                ) : (
                    <>
                        <div className="wc-detail-head">
                            <div>
                                <h1>{competition.name} {competition.year}</h1>
                                <p>Format Coupe du Monde 2026 — Classements des groupes.</p>
                            </div>
                        </div>

                        <div className="wc-group-grid">
                            {groupNames.map((groupName) => (
                                <section className="wc-card wc-standings-card" key={groupName}>
                                    <h2>Groupe {groupName}</h2>
                                    <div className="wc-table-wrapper">
                                        <table className="wc-standings-table">
                                            <thead>
                                                <tr>
                                                    <th>Pos</th>
                                                    <th>Equipe</th>
                                                    <th>J</th>
                                                    <th>V</th>
                                                    <th>N</th>
                                                    <th>D</th>
                                                    <th>BP</th>
                                                    <th>BC</th>
                                                    <th>Diff</th>
                                                    <th>Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {standings[groupName].map((team) => (
                                                    <tr key={team.standing_id}>
                                                        <td>{team.position}</td>
                                                        <td>
                                                            <div className="wc-match-team">
                                                                {team.flag_url && <img src={team.flag_url} alt="" className="wc-flag" />}
                                                                <span>{team.name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{team.matches_played}</td>
                                                        <td>{team.wins}</td>
                                                        <td>{team.draws}</td>
                                                        <td>{team.losses}</td>
                                                        <td>{team.goals_for}</td>
                                                        <td>{team.goals_against}</td>
                                                        <td>{team.goal_difference}</td>
                                                        <td>{team.points}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
