import { useEffect, useMemo, useState } from 'react';
import { SingleEliminationBracket, createTheme } from '@g-loot/react-tournament-brackets';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, stageLabel, statusLabel } from '../utils/formatters';
import trophyImage from '../assets/world-cup-trophy.png';
import './WorldCupPages.css';

const MAIN_STAGES = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];
const STAGE_SIZES = {
    round_of_32: 16,
    round_of_16: 8,
    quarter_final: 4,
    semi_final: 2,
    final: 1,
};
const NEXT_STAGE = {
    round_of_32: 'round_of_16',
    round_of_16: 'quarter_final',
    quarter_final: 'semi_final',
    semi_final: 'final',
};
const ROUND_LABELS = ['32ES DE FINALE', '8ES DE FINALE', 'QUARTS', 'DEMIES', 'FINALE'];

const bracketTheme = createTheme({
    fontFamily: '"Segoe UI", Arial, sans-serif',
    textColor: {
        main: '#1a1a2e',
        highlighted: '#ffffff',
        dark: '#0a2351',
        disabled: '#6c757d',
    },
    matchBackground: {
        wonColor: '#ffffff',
        lostColor: '#ffffff',
    },
    score: {
        background: {
            wonColor: '#e8a217',
            lostColor: '#e9eef5',
        },
        text: {
            highlightedWonColor: '#0a2351',
            highlightedLostColor: '#0a2351',
        },
    },
    border: {
        color: '#d8e0ea',
        highlightedColor: '#e8a217',
    },
    roundHeaders: {
        background: '#0a2351',
    },
    canvasBackground: '#ffffff',
});

const bracketOptions = {
    style: {
        width: 215,
        boxHeight: 104,
        canvasPadding: 24,
        spaceBetweenColumns: 50,
        spaceBetweenRows: 18,
        connectorColor: '#9aa8ba',
        connectorColorHighlight: '#e8a217',
        roundSeparatorWidth: 18,
        horizontalOffset: 12,
        roundHeader: {
            height: 38,
            marginBottom: 22,
            fontSize: 13,
            fontColor: '#ffffff',
            backgroundColor: '#0a2351',
            fontFamily: '"Segoe UI", Arial, sans-serif',
            roundTextGenerator: (roundIndex) => ROUND_LABELS[roundIndex - 1],
        },
    },
};

const getInitials = (name) => {
    if (!name) return 'TBD';

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
};

const getCompetitionTitle = (competition) => {
    if (!competition) return '';

    const name = competition.name || '';
    const year = competition.year ? String(competition.year) : '';

    if (!year || name.includes(year)) return name;

    return `${name} ${year}`;
};

const matchId = (stage, position) => `${stage}-${position}`;

const getNextMatchId = (stage, position) => {
    const nextStage = NEXT_STAGE[stage];
    if (!nextStage) return null;

    return matchId(nextStage, Math.ceil(position / 2));
};

const getParticipant = (match, side) => {
    const prefix = side === 'home' ? 'home' : 'away';
    const teamId = match?.[`${prefix}_team_id`];
    const name = match?.[`${prefix}_team_name`] || 'A determiner';
    const score = match?.[`${prefix}_score`];
    const winnerId = match?.winner_team_id;

    return {
        id: teamId || `${match?.knockout_id || 'pending'}-${prefix}`,
        name,
        flag: match?.[`${prefix}_flag`],
        resultText: score === null || score === undefined ? '-' : String(score),
        isWinner: Boolean(teamId && winnerId && Number(teamId) === Number(winnerId)),
        status: match?.status === 'finished' ? 'PLAYED' : null,
    };
};

const mapBracketMatch = (match, stage, index) => {
    const position = Number(match.position) || index + 1;

    return {
        ...match,
        id: matchId(stage, position),
        name: stageLabel[stage] || stage,
        nextMatchId: getNextMatchId(stage, position),
        tournamentRoundText: String(MAIN_STAGES.indexOf(stage) + 1),
        startTime: formatDateTime(match.kickoff_at),
        state: match.status === 'finished' ? 'SCORE_DONE' : 'NO_PARTY',
        statusText: statusLabel[match.status] || match.status || 'Planifie',
        participants: [
            getParticipant(match, 'home'),
            getParticipant(match, 'away'),
        ],
    };
};

const getStageMatches = (bracket, stage) => {
    const existingMatches = new Map(
        (bracket?.[stage] || []).map((match, index) => [
            Number(match.position) || index + 1,
            match,
        ])
    );

    return Array.from({ length: STAGE_SIZES[stage] }, (_, index) => {
        const position = index + 1;
        return existingMatches.get(position) || {
            knockout_id: `placeholder-${stage}-${position}`,
            position,
            status: 'scheduled',
        };
    });
};

const buildTournamentMatches = (bracket) => MAIN_STAGES.flatMap((stage) => (
    getStageMatches(bracket, stage).map((match, index) => mapBracketMatch(match, stage, index))
));

function TournamentParty({ party, won }) {
    const isPlaceholder = !party?.flag;

    return (
        <div className={`wc-tournament-party${won ? ' is-winner' : ''}`}>
            {party?.flag ? (
                <img src={party.flag} alt="" className="wc-tournament-flag" />
            ) : (
                <span className="wc-tournament-flag wc-tournament-flag-placeholder">
                    {getInitials(party?.name)}
                </span>
            )}
            <span className="wc-tournament-name" title={party?.name}>
                {party?.name}
            </span>
            <strong className={`wc-tournament-score${isPlaceholder ? ' is-muted' : ''}`}>
                {party?.resultText || '-'}
            </strong>
        </div>
    );
}

function TournamentMatch({
    match,
    topParty,
    bottomParty,
    topWon,
    bottomWon,
}) {
    return (
        <div className="wc-tournament-match">
            <div className="wc-tournament-match-head">
                <span>Match {match.position}</span>
                <span>{match.statusText}</span>
            </div>
            <TournamentParty party={topParty} won={topWon} />
            <TournamentParty party={bottomParty} won={bottomWon} />
            <div className="wc-tournament-match-foot">{match.startTime}</div>
        </div>
    );
}

function BracketScrollWrapper({ children, bracketWidth, bracketHeight }) {
    return (
        <div className="wc-tournament-scroll">
            <div className="wc-tournament-canvas" style={{ width: bracketWidth, height: bracketHeight }}>
                {children}
            </div>
        </div>
    );
}

export default function Knockout() {
    const { addToast } = useToast();
    const [competition, setCompetition] = useState(null);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [bracket, setBracket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetition = async () => {
            try {
                const res = await api.get('/competitions');
                const list = res.data.competitions || [];
                if (list.length > 0) {
                    setCompetition(list[0]);
                    setSelectedCompetition(list[0].competition_id);
                }
            } catch (error) {
                console.error(error);
                addToast('Impossible de charger la competition', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCompetition();
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

    const competitionTitle = getCompetitionTitle(competition);
    const tournamentMatches = useMemo(() => buildTournamentMatches(bracket), [bracket]);
    const thirdPlaceMatch = bracket?.third_place?.[0]
        ? mapBracketMatch(bracket.third_place[0], 'third_place', 0)
        : null;

    return (
        <div className="page-content">
            <div className="wc-shell wc-knockout-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Phases finales</h1>
                        <p>Visualisez le bracket de la competition et suivez les equipes qualifiees.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement du bracket...</div>
                ) : !bracket ? (
                    <div className="wc-empty">Aucun bracket disponible pour le moment.</div>
                ) : (
                    <>
                        <div className="wc-detail-head wc-knockout-head">
                            <div>
                                <h1>{competitionTitle}</h1>
                                <p>Le tableau se met a jour apres chaque resultat valide.</p>
                            </div>
                        </div>

                        <div className="wc-knockout-board">
                            <div className="wc-knockout-board-head">
                                <div>
                                    <span>Tableau final</span>
                                    <strong>{competitionTitle}</strong>
                                </div>
                                <img src={trophyImage} alt="" className="wc-knockout-trophy" />
                            </div>

                            {tournamentMatches.length ? (
                                <SingleEliminationBracket
                                    matches={tournamentMatches}
                                    matchComponent={TournamentMatch}
                                    theme={bracketTheme}
                                    options={bracketOptions}
                                    svgWrapper={BracketScrollWrapper}
                                />
                            ) : (
                                <div className="wc-empty">Aucun match pour cette phase.</div>
                            )}

                            <div className="wc-third-place-panel">
                                <div>
                                    <h2>3e place</h2>
                                    <p>{stageLabel.third_place}</p>
                                </div>
                                {thirdPlaceMatch ? (
                                    <div className="wc-third-place-match">
                                        <TournamentMatch
                                            match={thirdPlaceMatch}
                                            topParty={thirdPlaceMatch.participants[0]}
                                            bottomParty={thirdPlaceMatch.participants[1]}
                                            topWon={thirdPlaceMatch.participants[0].isWinner}
                                            bottomWon={thirdPlaceMatch.participants[1].isWinner}
                                        />
                                    </div>
                                ) : (
                                    <div className="wc-empty">Aucun match de petite finale.</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
