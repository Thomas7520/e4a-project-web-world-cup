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
    // Vérifier si le bracket existe déjà
    const [existing] = await db.query(
      `SELECT knockout_id FROM knockout_matches 
       WHERE competition_id = ? LIMIT 1`,
      [competitionId]
    );

    if (existing.length > 0) {
      console.log('Bracket déjà initialisé pour cette compétition');
      return;
    }

    // Récupérer les 12 groupes
    const [groups] = await db.query(
      `SELECT group_id FROM groups_pool WHERE competition_id = ? ORDER BY name ASC`,
      [competitionId]
    );

    if (groups.length !== 12) {
      throw new Error('La compétition doit avoir 12 groupes');
    }

    // 1. Créer les 16 matchs des 8e de finale
    // Positions : 1 vs 2 de groupes opposés
    // Groupe A (1er) vs Groupe B (2e), Groupe C (1er) vs Groupe D (2e), etc.
    const eighthFinalPairings = [
      { groupA: 0, groupB: 1 }, // A1 vs B2
      { groupA: 1, groupB: 0 }, // B1 vs A2
      { groupA: 2, groupB: 3 }, // C1 vs D2
      { groupA: 3, groupB: 2 }, // D1 vs C2
      { groupA: 4, groupB: 5 }, // E1 vs F2
      { groupA: 5, groupB: 4 }, // F1 vs E2
      { groupA: 6, groupB: 7 }, // G1 vs H2
      { groupA: 7, groupB: 6 }, // H1 vs G2
      { groupA: 8, groupB: 9 }, // I1 vs J2
      { groupA: 9, groupB: 8 }, // J1 vs I2
      { groupA: 10, groupB: 11 }, // K1 vs L2
      { groupA: 11, groupB: 10 }, // L1 vs K2
      { groupA: 0, groupB: 5 }, // A (1er/2e) vs F (2e/1er)
      { groupA: 1, groupB: 4 }, // B vs E
      { groupA: 2, groupB: 7 }, // C vs H
      { groupA: 3, groupB: 6 }, // D vs G
    ];

    for (let i = 0; i < eighthFinalPairings.length; i++) {
      const pairing = eighthFinalPairings[i];
      
      // Récupérer les équipes qualifiées
      const [teamA] = await db.query(
        `SELECT team_id FROM standings 
         WHERE group_id = ? AND position = ?`,
        [groups[pairing.groupA].group_id, pairing.groupA % 2 === 0 ? 1 : 2]
      );

      const [teamB] = await db.query(
        `SELECT team_id FROM standings 
         WHERE group_id = ? AND position = ?`,
        [groups[pairing.groupB].group_id, pairing.groupB % 2 === 0 ? 2 : 1]
      );

      if (teamA.length > 0 && teamB.length > 0) {
        await db.query(
          `INSERT INTO knockout_matches 
            (competition_id, stage, position, home_team_id, away_team_id)
          VALUES (?, 'round_of_16', ?, ?, ?)`,
          [competitionId, i + 1, teamA[0].team_id, teamB[0].team_id]
        );
      }
    }

    // 2. Créer les 8 matchs des quarts de finale
    for (let i = 0; i < 8; i++) {
      await db.query(
        `INSERT INTO knockout_matches 
          (competition_id, stage, position, home_team_id, away_team_id)
        VALUES (?, 'quarter_final', ?, NULL, NULL)`,
        [competitionId, i + 1]
      );
    }

    // 3. Créer les 4 matchs des demi-finales
    for (let i = 0; i < 4; i++) {
      await db.query(
        `INSERT INTO knockout_matches 
          (competition_id, stage, position, home_team_id, away_team_id)
        VALUES (?, 'semi_final', ?, NULL, NULL)`,
        [competitionId, i + 1]
      );
    }

    // 4. Créer le match pour la 3e place
    await db.query(
      `INSERT INTO knockout_matches 
        (competition_id, stage, position)
      VALUES (?, 'third_place', 1)`,
      [competitionId]
    );

    // 5. Créer la finale
    await db.query(
      `INSERT INTO knockout_matches 
        (competition_id, stage, position)
      VALUES (?, 'final', 1)`,
      [competitionId]
    );

    console.log('Bracket des phases finales initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du bracket:', error);
    throw error;
  }
}

/**
 * Met à jour le bracket en fonction des résultats des matchs
 * Appelé après la fin d'un match de knockout
 * @param {number} matchId - ID du match terminé
 * @param {number} winnerId - ID de l'équipe gagnante
 * @returns {Promise<void>}
 */
async function updateBracketAfterMatch(matchId, winnerId) {
  try {
    // Récupérer le match knockout associé
    const [knockoutMatch] = await db.query(
      `SELECT knockout_id, competition_id, stage, position FROM knockout_matches 
       WHERE match_id = ?`,
      [matchId]
    );

    if (knockoutMatch.length === 0) {
      console.log('Pas de match knockout pour le match', matchId);
      return;
    }

    const knockout = knockoutMatch[0];

    // Mettre à jour le winner
    await db.query(
      `UPDATE knockout_matches SET winner_team_id = ? 
       WHERE knockout_id = ?`,
      [winnerId, knockout.knockout_id]
    );

    // Déterminer l'équipe suivante et le stage suivant
    const nextStage = getNextStage(knockout.stage);
    if (!nextStage) return; // Fin de la compétition

    // Déterminer la position du match suivant
    const nextPosition = Math.ceil(knockout.position / 2);

    // Déterminer si le gagnant va en home ou away
    const isHomeInNext = knockout.position % 2 === 1;

    // Récupérer le match du tour suivant
    const [nextMatches] = await db.query(
      `SELECT knockout_id, home_team_id, away_team_id FROM knockout_matches 
       WHERE competition_id = ? AND stage = ? AND position = ?`,
      [knockout.competition_id, nextStage, nextPosition]
    );

    if (nextMatches.length === 0) {
      console.log(`Pas de match suivant trouvé pour stage=${nextStage}, position=${nextPosition}`);
      return;
    }

    const nextMatch = nextMatches[0];

    // Mettre à jour le match suivant avec le gagnant
    if (isHomeInNext) {
      await db.query(
        `UPDATE knockout_matches SET home_team_id = ? WHERE knockout_id = ?`,
        [winnerId, nextMatch.knockout_id]
      );
    } else {
      await db.query(
        `UPDATE knockout_matches SET away_team_id = ? WHERE knockout_id = ?`,
        [winnerId, nextMatch.knockout_id]
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bracket:', error);
    throw error;
  }
}

/**
 * Détermine le stage suivant dans la progression
 * @param {string} currentStage - Stage actuel
 * @returns {string|null}
 */
function getNextStage(currentStage) {
  const stages = {
    round_of_16: 'quarter_final',
    quarter_final: 'semi_final',
    semi_final: ['final', 'third_place'], // Les deux
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
    const stages = ['round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];
    const bracket = {};

    for (const stage of stages) {
      const [matches] = await db.query(
        `SELECT 
          ko.knockout_id, ko.position, ko.home_team_id, ko.away_team_id, 
          ko.match_id, ko.winner_team_id,
          home.name as home_team_name, away.name as away_team_name,
          winner.name as winner_team_name,
          m.home_score, m.away_score, m.status
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
