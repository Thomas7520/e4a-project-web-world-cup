const db = require('../config/db');

/**
 * Service de gestion des phases finales (knockout)
 * Génère et met à jour l'arbre de compétition (8e, quarts, demi, finale)
 */

/**
 * Initialise l'arbre des phases finales pour une compétition
 * Doit être appelé une fois après la finalisation des groupes
 * @param {number} competitionId - ID de la compétition
 * @returns {Promise<void>}
 */
async function initializeKnockoutBracket(competitionId) {
  try {
    const [existing] = await db.query(
      `SELECT knockout_id FROM knockout_matches WHERE competition_id = ? LIMIT 1`,
      [competitionId]
    );

    if (existing.length > 0) {
      console.log('Bracket déjà initialisé pour cette compétition');
      return;
    }

    const [groups] = await db.query(
      `SELECT group_id, name FROM groups_pool WHERE competition_id = ? ORDER BY name ASC`,
      [competitionId]
    );

    if (groups.length === 0) {
      throw new Error('Aucun groupe trouvé pour cette compétition');
    }

    const [standings] = await db.query(
      `SELECT
        s.team_id, s.position, s.points, s.goal_difference, s.goals_for,
        g.name as group_name
       FROM standings s
       JOIN groups_pool g ON s.group_id = g.group_id
       WHERE g.competition_id = ? AND s.position IN (1, 2, 3)
       ORDER BY g.name ASC, s.position ASC`,
      [competitionId]
    );

    const qualifiers = getKnockoutQualifiers(groups, standings);
    const totalQualifiers = qualifiers.length;
    const stages = getStageNames(totalQualifiers);
    const firstStage = stages[0];
    const firstRoundPairs = buildFirstRoundPairs(qualifiers);

    for (let i = 0; i < firstRoundPairs.length; i++) {
      const [home, away] = firstRoundPairs[i];

      await db.query(
        `INSERT INTO knockout_matches 
          (competition_id, stage, position, home_team_id, away_team_id)
         VALUES (?, ?, ?, ?, ?)`,
        [competitionId, firstStage, i + 1, home.team_id, away.team_id]
      );
    }

    for (let stageIndex = 1; stageIndex < stages.length; stageIndex++) {
      const stageName = stages[stageIndex];
      const matchCount = totalQualifiers / Math.pow(2, stageIndex + 1);

      for (let i = 0; i < matchCount; i++) {
        await db.query(
          `INSERT INTO knockout_matches 
            (competition_id, stage, position, home_team_id, away_team_id)
           VALUES (?, ?, ?, NULL, NULL)`,
          [competitionId, stageName, i + 1]
        );
      }
    }

    await db.query(
      `INSERT INTO knockout_matches 
        (competition_id, stage, position, home_team_id, away_team_id)
       VALUES (?, 'third_place', 1, NULL, NULL)`,
      [competitionId]
    );

    await db.query(
      `INSERT INTO knockout_matches 
        (competition_id, stage, position, home_team_id, away_team_id)
       VALUES (?, 'final', 1, NULL, NULL)`,
      [competitionId]
    );

    console.log('Bracket des phases finales initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du bracket:', error);
    throw error;
  }
}

function getKnockoutQualifiers(groups, standings) {
  const groupNames = groups.map((group) => group.name);
  const targetQualifierCount = getTargetQualifierCount(groupNames.length * 2);
  const winners = [];
  const runners = [];
  const thirds = [];

  for (const groupName of groupNames) {
    const groupStandings = standings.filter((standing) => standing.group_name === groupName);
    const winner = groupStandings.find((standing) => standing.position === 1);
    const runner = groupStandings.find((standing) => standing.position === 2);
    const third = groupStandings.find((standing) => standing.position === 3);

    if (!winner || !runner) {
      throw new Error(`Impossible de générer le bracket : le groupe ${groupName} n'a pas deux qualifiés`);
    }

    winners.push(winner);
    runners.push(runner);

    if (third) {
      thirds.push(third);
    }
  }

  const automaticQualifiers = [...winners, ...runners];
  const thirdPlaceNeeded = targetQualifierCount - automaticQualifiers.length;

  if (thirdPlaceNeeded < 0) {
    throw new Error('Impossible de générer le bracket : trop de qualifiés automatiques');
  }

  if (thirdPlaceNeeded > thirds.length) {
    throw new Error('Impossible de générer le bracket : pas assez de troisièmes pour compléter le tableau');
  }

  const bestThirds = thirds
    .sort(compareQualifiedTeams)
    .slice(0, thirdPlaceNeeded)
    .map((third) => ({ ...third, qualified_as: 'best_third' }));

  return [
    ...winners.map((winner) => ({ ...winner, qualified_as: 'winner' })),
    ...runners.map((runner) => ({ ...runner, qualified_as: 'runner' })),
    ...bestThirds,
  ];
}

function compareQualifiedTeams(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return String(a.group_name).localeCompare(String(b.group_name));
}

function getTargetQualifierCount(automaticQualifierCount) {
  if (automaticQualifierCount > 32) {
    throw new Error('Impossible de générer le bracket : plus de 32 qualifiés automatiques');
  }

  let target = 8;
  while (target < automaticQualifierCount) {
    target *= 2;
  }

  return target;
}

function buildFirstRoundPairs(qualifiers) {
  const winners = qualifiers.filter((q) => q.qualified_as === 'winner');
  const runners = qualifiers.filter((q) => q.qualified_as === 'runner');
  const bestThirds = qualifiers.filter((q) => q.qualified_as === 'best_third');
  const matchCount = qualifiers.length / 2;
  const homeSeeds = [...winners, ...bestThirds.slice(0, matchCount - winners.length)];
  const awaySeeds = [...runners, ...bestThirds.slice(matchCount - winners.length)].reverse();

  if (homeSeeds.length !== matchCount || awaySeeds.length !== matchCount) {
    throw new Error('Impossible de générer le bracket : répartition des têtes de série invalide');
  }

  avoidSameGroupFirstRound(homeSeeds, awaySeeds);

  return homeSeeds.map((home, index) => [home, awaySeeds[index]]);
}

function avoidSameGroupFirstRound(homeSeeds, awaySeeds) {
  for (let i = 0; i < homeSeeds.length; i++) {
    if (homeSeeds[i].group_name !== awaySeeds[i].group_name) continue;

    const swapIndex = awaySeeds.findIndex((away, index) => (
      index !== i
      && away.group_name !== homeSeeds[i].group_name
      && awaySeeds[i].group_name !== homeSeeds[index].group_name
    ));

    if (swapIndex === -1) {
      throw new Error('Impossible de générer le bracket : conflit de groupe au premier tour');
    }

    [awaySeeds[i], awaySeeds[swapIndex]] = [awaySeeds[swapIndex], awaySeeds[i]];
  }
}

async function updateBracketAfterMatch(matchId, winnerId) {
  try {
    const [knockoutMatch] = await db.query(
      `SELECT knockout_id, competition_id, stage, position FROM knockout_matches WHERE match_id = ?`,
      [matchId]
    );

    if (knockoutMatch.length === 0) {
      console.log('Pas de match knockout pour le match', matchId);
      return;
    }

    const knockout = knockoutMatch[0];

    await db.query(
      `UPDATE knockout_matches SET winner_team_id = ? WHERE knockout_id = ?`,
      [winnerId, knockout.knockout_id]
    );

    const nextStage = getNextStage(knockout.stage);
    if (!nextStage) return;

    const nextPosition = Math.ceil(knockout.position / 2);
    const isHomeInNext = knockout.position % 2 === 1;

    const [nextMatches] = await db.query(
      `SELECT knockout_id FROM knockout_matches 
       WHERE competition_id = ? AND stage = ? AND position = ?`,
      [knockout.competition_id, nextStage, nextPosition]
    );

    if (nextMatches.length === 0) {
      console.log(`Pas de match suivant trouvé pour stage=${nextStage}, position=${nextPosition}`);
      return;
    }

    const nextMatch = nextMatches[0];
    const targetColumn = isHomeInNext ? 'home_team_id' : 'away_team_id';

    await db.query(
      `UPDATE knockout_matches SET ${targetColumn} = ? WHERE knockout_id = ?`,
      [winnerId, nextMatch.knockout_id]
    );

    if (knockout.stage === 'semi_final') {
      const [matchRows] = await db.query(
        `SELECT home_team_id, away_team_id, home_score, away_score FROM matches WHERE match_id = ?`,
        [matchId]
      );

      if (matchRows.length > 0) {
        const currentMatch = matchRows[0];
        const loserId = currentMatch.home_team_id === winnerId
          ? currentMatch.away_team_id
          : currentMatch.home_team_id;

        const [thirdPlaceMatches] = await db.query(
          `SELECT knockout_id FROM knockout_matches 
           WHERE competition_id = ? AND stage = 'third_place' AND position = 1`,
          [knockout.competition_id]
        );

        if (thirdPlaceMatches.length > 0) {
          const thirdPlaceMatch = thirdPlaceMatches[0];
          const loserTarget = knockout.position % 2 === 1 ? 'home_team_id' : 'away_team_id';

          await db.query(
            `UPDATE knockout_matches SET ${loserTarget} = ? WHERE knockout_id = ?`,
            [loserId, thirdPlaceMatch.knockout_id]
          );
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bracket:', error);
    throw error;
  }
}

function getStageNames(qualifierCount) {
  const names = [];

  if (qualifierCount === 32) {
    names.push('round_of_32');
    names.push('round_of_16');
    names.push('quarter_final');
    names.push('semi_final');
  } else if (qualifierCount === 16) {
    names.push('round_of_16');
    names.push('quarter_final');
    names.push('semi_final');
  } else if (qualifierCount === 8) {
    names.push('quarter_final');
    names.push('semi_final');
  } else {
    throw new Error('Unsupported qualifier count for knockout bracket');
  }

  return names;
}

function getNextStage(currentStage) {
  const stages = {
    round_of_32: 'round_of_16',
    round_of_16: 'quarter_final',
    quarter_final: 'semi_final',
    semi_final: 'final',
    third_place: null,
    final: null,
  };

  return stages[currentStage] || null;
}

/**
 * Récupère l'arbre complet des phases finales
 * @param {number} competitionId - ID de la compétition
 * @returns {Promise<Object>}
 */
async function getKnockoutBracket(competitionId) {
  try {
    const stages = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];
    const bracket = {};

    for (const stage of stages) {
      const [matches] = await db.query(
        `SELECT 
          ko.knockout_id, ko.position, ko.home_team_id, ko.away_team_id, 
          ko.match_id, ko.winner_team_id,
          home.name as home_team_name, home.flag_url as home_flag,
          away.name as away_team_name, away.flag_url as away_flag,
          winner.name as winner_team_name, winner.flag_url as winner_flag,
          m.home_score, m.away_score, m.status, m.kickoff_at
        FROM knockout_matches ko
        LEFT JOIN teams home ON ko.home_team_id = home.team_id
        LEFT JOIN teams away ON ko.away_team_id = away.team_id
        LEFT JOIN teams winner ON ko.winner_team_id = winner.team_id
        LEFT JOIN matches m ON ko.match_id = m.match_id
        WHERE ko.competition_id = ? AND ko.stage = ?
        ORDER BY ko.position ASC`,
        [competitionId, stage]
      );

      bracket[stage] = matches;
    }

    return bracket;
  } catch (error) {
    console.error('Erreur lors de la récupération du bracket:', error);
    throw error;
  }
}

/**
 * Récupère les matchs d'une phase spécifique
 * @param {number} competitionId - ID de la compétition
 * @param {string} stage - Stage (round_of_16, quarter_final, etc.)
 * @returns {Promise<Array>}
 */
async function getStageMatches(competitionId, stage) {
  try {
    const [matches] = await db.query(
      `SELECT 
        ko.knockout_id, ko.position, ko.home_team_id, ko.away_team_id,
        ko.match_id, ko.winner_team_id,
        home.name as home_team_name, home.flag_url as home_flag,
        away.name as away_team_name, away.flag_url as away_flag,
        winner.name as winner_team_name,
        m.home_score, m.away_score, m.status, m.kickoff_at
      FROM knockout_matches ko
      LEFT JOIN teams home ON ko.home_team_id = home.team_id
      LEFT JOIN teams away ON ko.away_team_id = away.team_id
      LEFT JOIN teams winner ON ko.winner_team_id = winner.team_id
      LEFT JOIN matches m ON ko.match_id = m.match_id
      WHERE ko.competition_id = ? AND ko.stage = ?
      ORDER BY ko.position ASC`,
      [competitionId, stage]
    );

    return matches;
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs du stage:', error);
    throw error;
  }
}

module.exports = {
  initializeKnockoutBracket,
  updateBracketAfterMatch,
  getNextStage,
  getKnockoutBracket,
  getStageMatches,
};
