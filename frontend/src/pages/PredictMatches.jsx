import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './PredictMatches.css';

const STAGE_LABEL = {
    group: 'Phase de groupes',
    round_of_32: '32es de finale',
    round_of_16: '16es de finale',
    quarter_final: 'Quarts de finale',
    semi_final: 'Demi-finales',
    third_place: 'Troisième place',
    final: 'Finale',
};

export default function PredictMatches() {
    const { addToast } = useToast();
    const [matches, setMatches] = useState([]);
    const [inputs, setInputs] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/matches'),
            api.get('/predictions/me'),
        ]).then(([matchesRes, predsRes]) => {
            // Seulement les matchs à venir
            const scheduled = (matchesRes.data.matches || []).filter(m => m.status === 'scheduled');
            setMatches(scheduled);

            // Pré-remplir les inputs avec les pronos existants
            const existing = {};
            for (const p of predsRes.data || []) {
                existing[p.match_id] = { home: p.predicted_home, away: p.predicted_away, saved: true };
            }
            setInputs(existing);
        }).catch(() => {
            addToast('Impossible de charger les matchs', 'error');
        }).finally(() => setLoading(false));
    }, []);

    const handleChange = (matchId, team, value) => {
        setInputs(prev => ({
            ...prev,
            [matchId]: { ...prev[matchId], [team]: value === '' ? '' : parseInt(value) || 0, saved: false },
        }));
    };

    const handleSubmit = async (e, matchId) => {
        e.preventDefault();
        const score = inputs[matchId];
        if (!score || score.home === undefined || score.home === '' || score.away === undefined || score.away === '') {
            addToast('Entrez un score pour les deux équipes', 'error');
            return;
        }
        setSubmitting(s => ({ ...s, [matchId]: true }));
        try {
            await api.post('/predictions', {
                match_id: matchId,
                predicted_home_score: score.home,
                predicted_away_score: score.away,
            });
            setInputs(prev => ({ ...prev, [matchId]: { ...prev[matchId], saved: true } }));
            addToast('Pronostic enregistré !');
        } catch (err) {
            addToast(err.response?.data?.error || 'Erreur lors de l\'enregistrement', 'error');
        } finally {
            setSubmitting(s => ({ ...s, [matchId]: false }));
        }
    };

    // Grouper par phase
    const grouped = matches.reduce((acc, m) => {
        const stage = m.stage || 'other';
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(m);
        return acc;
    }, {});

    const stageOrder = ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];
    const sortedStages = Object.keys(grouped).sort(
        (a, b) => (stageOrder.indexOf(a) ?? 99) - (stageOrder.indexOf(b) ?? 99)
    );

    if (loading) return <div className="pm-loading">Chargement des matchs...</div>;

    return (
        <div className="pm-shell">
            <div className="pm-header">
                <h1>Pronostics</h1>
                <p>Pariez sur les matchs à venir. Les paris sont fermés dès le coup d'envoi.</p>
            </div>

            {matches.length === 0 ? (
                <div className="pm-empty">
                    <p>Aucun match ouvert aux pronostics pour le moment.</p>
                </div>
            ) : (
                sortedStages.map(stage => (
                    <section key={stage} className="pm-stage">
                        <h2 className="pm-stage-title">{STAGE_LABEL[stage] || stage}</h2>
                        <div className="pm-list">
                            {grouped[stage].map(match => {
                                const id = match.match_id;
                                const score = inputs[id];
                                const isSaved = score?.saved;
                                const isSubmitting = submitting[id];

                                return (
                                    <form key={id} className={`pm-card${isSaved ? ' pm-card--saved' : ''}`} onSubmit={(e) => handleSubmit(e, id)}>
                                        <div className="pm-card-meta">
                                            <span>{match.kickoff_at ? new Date(match.kickoff_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date à confirmer'}</span>
                                            {match.stadium_name && <span>{match.stadium_name}</span>}
                                            {isSaved && <span className="pm-saved-badge">Enregistré ✓</span>}
                                        </div>

                                        <div className="pm-card-body">
                                            <span className="pm-team pm-team--home">{match.home_team_name}</span>

                                            <div className="pm-inputs">
                                                <input
                                                    type="number" min="0" max="99"
                                                    className="pm-score"
                                                    value={score?.home ?? ''}
                                                    onChange={(e) => handleChange(id, 'home', e.target.value)}
                                                    placeholder="0"
                                                />
                                                <span className="pm-dash">–</span>
                                                <input
                                                    type="number" min="0" max="99"
                                                    className="pm-score"
                                                    value={score?.away ?? ''}
                                                    onChange={(e) => handleChange(id, 'away', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <span className="pm-team pm-team--away">{match.away_team_name}</span>

                                            <button
                                                type="submit"
                                                className={`btn btn-sm${isSaved ? ' btn-outline' : ' btn-primary'}`}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? '...' : isSaved ? 'Modifier' : 'Valider'}
                                            </button>
                                        </div>
                                    </form>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}
