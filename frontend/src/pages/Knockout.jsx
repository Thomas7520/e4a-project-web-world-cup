import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './WorldCupPages.css';

const stageLabels = {
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarter_final: 'Quarter-finals',
    semi_final: 'Semi-finals',
    third_place: 'Third place',
    final: 'Final',
};

export default function Knockout() {
    const { addToast } = useToast();
    const [competitions, setCompetitions] = useState([]);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [competition, setCompetition] = useState(null);
    const [bracket, setBracket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const res = await api.get('/competitions');
                const list = res.data.competitions || [];
                setCompetitions(list);
                if (list.length > 0) {
                    setSelectedCompetition(list[0].competition_id);
                    setCompetition(list[0]);
                }
            } catch (error) {
                console.error(error);
                addToast('Impossible de charger les compétitions', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCompetitions();
    }, [addToast]);

    useEffect(() => {
        const fetchBracket = async () => {
            if (!selectedCompetition) return;

            setLoading(true);
            try {
                const res = await api.get(`/knockout/${selectedCompetition}`);
                setBracket(res.data.bracket);
                setCompetition(res.data.competition);
            } catch (error) {
                console.error(error);
                addToast('Impossible de charger le tableau des phases finales', 'error');
                setBracket(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBracket();
    }, [selectedCompetition, addToast]);

    const handleCompetitionChange = (event) => {
        setSelectedCompetition(Number(event.target.value));
    };

    const displayStage = (stage) => {
        const matches = bracket?.[stage] || [];
        if (!matches.length) {
            return <div className="wc-empty">Aucun match pour cette phase.</div>;
        }

        return (
            <div className="wc-bracket-stage wc-card" key={stage}>
                <h3>{stageLabels[stage] || stage}</h3>
                {matches.map((match) => (
                    <article className="wc-bracket-match" key={match.knockout_id}>
                        <div className="wc-bracket-team">
                            <span>{match.home_team_name || 'TBD'}</span>
                            <strong className="wc-bracket-score">{match.home_score ?? '-'}</strong>
                        </div>
                        <div className="wc-bracket-team">
                            <span>{match.away_team_name || 'TBD'}</span>
                            <strong className="wc-bracket-score">{match.away_score ?? '-'}</strong>
                        </div>
                        <span>Status: {match.status || 'Scheduled'}</span>
                    </article>
                ))}
            </div>
        );
    };

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Phases finales</h1>
                        <p>Visualisez le bracket de la compétition et suivez les équipes qualifiées.</p>
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
                    <div className="wc-loading">Chargement du bracket...</div>
                ) : !bracket ? (
                    <div className="wc-empty">Aucun bracket disponible pour le moment.</div>
                ) : (
                    <>
                        <div className="wc-detail-head">
                            <div>
                                <h1>{competition?.name} {competition?.year}</h1>
                                <p>Bracket des phases finales. Les résultats se mettent à jour après chaque match.</p>
                            </div>
                        </div>

                        <div className="wc-bracket-grid">
                            {Object.keys(stageLabels).map((stage) => displayStage(stage))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
