const db = require('../config/db');

/**
 * Service de calcul automatique des classements (standings)
 * Recalcule les statistiques d'une équipe dans un groupe basé sur les matchs terminés
 */

/**
 * Recalcule les standings pour un groupe après la modification d'un score
 * @param {number} competitionId - ID de la compétition
 * @param {number} groupId - ID du groupe
 * @returns {Promise<void>}
 */
async function recalculateGroupStandings(competitionId, groupId) {
  try {
    // Récupérer toutes les équipes du groupe
    const [teams] = await db.query(
      `SELECT team_id FROM teams WHERE group_id = ? AND competition_id = ? ORDER BY team_id ASC`,
      [groupId, competitionId]
    );

    // Pour chaque équipe, recalculer ses statistiques
    for (const { team_id } of teams) {
      await calculateTeamStats(competitionId, groupId, team_id);
    }

    // Mettre à jour les positions après avoir calculé tous les stats
    await updateGroupPositions(groupId);
  } catch (error) {
    console.error('Erreur lors du recalcul des standings:', error);
    throw error;
  }
}

/**
 * Calcule les statistiques d'une équipe dans un groupe
 * @param {number} competitionId - ID de la compétition
 * @param {number} groupId - ID du groupe
 * @param {number} teamId - ID de l'équipe
 * @returns {Promise<void>}
 */
async function calculateTeamStats(competitionId, groupId, teamId) {
  try {
    // Récupérer tous les matchs de groupe terminés pour cette équipe
    const [matches] = await db.query(
      `SELECT 
        m.match_id, m.home_team_id, m.away_team_id, 
        m.home_score, m.away_score, m.status
      FROM matches m
      WHERE m.competition_id = ? 
        AND m.group_id = ? 
        AND m.stage = 'group'
        AND m.status = 'finished'
        AND (m.home_team_id = ? OR m.away_team_id = ?)
      ORDER BY m.kickoff_at ASC`,
      [competitionId, groupId, teamId, teamId]
    );

    // Initialiser les statistiques
    let stats = {
      matches_played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    };

    // Parcourir les matchs et calculer les stats
    for (const match of matches) {
      stats.matches_played++;
      
      const isHome = match.home_team_id === teamId;
      const goalsFor = isHome ? match.home_score : match.away_score;
      const goalsAgainst = isHome ? match.away_score : match.home_score;

      stats.goals_for += goalsFor;
      stats.goals_against += goalsAgainst;

      if (goalsFor > goalsAgainst) {
        // Victoire
        stats.wins++;
        stats.points += 3;
      } else if (goalsFor === goalsAgainst) {
        // Match nul
        stats.draws++;
        stats.points += 1;
      } else {
        // Défaite
        stats.losses++;
        // Pas de points
      }
    }

    stats.goal_difference = stats.goals_for - stats.goals_against;

    // Vérifier si l'équipe existe déjà dans les standings
    const [existing] = await db.query(
      `SELECT standing_id FROM standings 
       WHERE group_id = ? AND team_id = ?`,
      [groupId, teamId]
    );

    if (existing.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE standings SET 
          matches_played = ?, wins = ?, draws = ?, losses = ?,
          goals_for = ?, goals_against = ?, goal_difference = ?, 
          points = ?, updated_at = NOW()
        WHERE group_id = ? AND team_id = ?`,
        [
          stats.matches_played,
          stats.wins,
          stats.draws,
          stats.losses,
          stats.goals_for,
          stats.goals_against,
          stats.goal_difference,
          stats.points,
          groupId,
          teamId,
        ]
      );
    } else {
      const [[{ next_position }]] = await db.query(
        `SELECT COALESCE(MAX(position), 0) + 1 as next_position
         FROM standings
         WHERE group_id = ?`,
        [groupId]
      );

      // Insérer
      await db.query(
        `INSERT INTO standings 
          (competition_id, group_id, team_id, position, matches_played, wins, draws, losses,
           goals_for, goals_against, goal_difference, points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          competitionId,
          groupId,
          teamId,
          next_position,
          stats.matches_played,
          stats.wins,
          stats.draws,
          stats.losses,
          stats.goals_for,
          stats.goals_against,
          stats.goal_difference,
          stats.points,
        ]
      );
    }
  } catch (error) {
    console.error(
      `Erreur lors du calcul des stats pour l'équipe ${teamId}:`,
      error
    );
    throw error;
  }
}

/**
 * Met à jour les positions des équipes dans un groupe en fonction des points
 * Règles de tri :
 * 1. Points (décroissant)
 * 2. Différence de buts (décroissant)
 * 3. Buts marqués (décroissant)
 * @param {number} groupId - ID du groupe
 * @returns {Promise<void>}
 */
async function updateGroupPositions(groupId) {
  try {
    // Récupérer les équipes triées par points, diff de buts, buts marqués
    const [standings] = await db.query(
      `SELECT standing_id FROM standings 
       WHERE group_id = ? 
       ORDER BY points DESC, goal_difference DESC, goals_for DESC`,
      [groupId]
    );

    // Mettre à jour les positions
    for (let i = 0; i < standings.length; i++) {
      await db.query(
        `UPDATE standings SET position = ? WHERE standing_id = ?`,
        [i + 1, standings[i].standing_id]
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des positions:', error);
    throw error;
  }
}

/**
 * Récupère les classements d'un groupe spécifique
 * @param {number} groupId - ID du groupe
 * @returns {Promise<Array>}
 */
async function getGroupStandings(groupId) {
  try {
    const [standings] = await db.query(
      `SELECT 
        s.standing_id, s.position, s.team_id, t.name, t.fifa_code, t.flag_url,
        s.matches_played, s.wins, s.draws, s.losses,
        s.goals_for, s.goals_against, s.goal_difference, s.points
      FROM standings s
      JOIN teams t ON s.team_id = t.team_id
      WHERE s.group_id = ?
      ORDER BY s.position ASC`,
      [groupId]
    );

    return standings;
  } catch (error) {
    console.error('Erreur lors de la récupération des standings:', error);
    throw error;
  }
}

/**
 * Récupère tous les classements d'une compétition (tous les groupes)
 * @param {number} competitionId - ID de la compétition
 * @returns {Promise<Object>}
 */
async function getCompetitionStandings(competitionId) {
  try {
    const [groups] = await db.query(
      `SELECT group_id, name FROM groups_pool 
       WHERE competition_id = ? 
       ORDER BY name ASC`,
      [competitionId]
    );

    const standings = {};
    for (const group of groups) {
      standings[group.name] = await getGroupStandings(group.group_id);
    }

    return standings;
  } catch (error) {
    console.error('Erreur lors de la récupération des standings de compétition:', error);
    throw error;
  }
}

/**
 * Initialise les standings pour un groupe (crée les entrées pour chaque équipe)
 * @param {number} competitionId - ID de la compétition
 * @param {number} groupId - ID du groupe
 * @returns {Promise<void>}
 */
async function initializeGroupStandings(competitionId, groupId) {
  try {
    // Récupérer toutes les équipes du groupe
    const [teams] = await db.query(
      `SELECT team_id FROM teams WHERE group_id = ? AND competition_id = ? ORDER BY team_id ASC`,
      [groupId, competitionId]
    );

    // Créer une entrée pour chaque équipe avec une position initiale stable
    for (const [index, { team_id }] of teams.entries()) {
      const [existing] = await db.query(
        `SELECT standing_id FROM standings 
         WHERE group_id = ? AND team_id = ?`,
        [groupId, team_id]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO standings 
            (competition_id, group_id, team_id, position, matches_played, wins, draws, 
             losses, goals_for, goals_against, goal_difference, points)
          VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
          [competitionId, groupId, team_id, index + 1]
        );
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des standings:', error);
    throw error;
  }
}

/**
 * Récupère les deux équipes qualifiées d'un groupe pour les 8e de finale
 * @param {number} groupId - ID du groupe
 * @returns {Promise<Array>}
 */
async function getQualifiedTeams(groupId) {
  try {
    const [qualified] = await db.query(
      `SELECT standing_id, team_id, position FROM standings 
       WHERE group_id = ? AND position IN (1, 2)
       ORDER BY position ASC`,
      [groupId]
    );

    return qualified;
  } catch (error) {
    console.error('Erreur lors de la récupération des qualifiés:', error);
    throw error;
  }
}

module.exports = {
  recalculateGroupStandings,
  calculateTeamStats,
  updateGroupPositions,
  getGroupStandings,
  getCompetitionStandings,
  initializeGroupStandings,
  getQualifiedTeams,
};
