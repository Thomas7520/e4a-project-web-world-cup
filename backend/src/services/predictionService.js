// backend/src/services/predictionService.js

/**
 * Calcule les points obtenus pour un pronostic donné.
 * @param {number} predictedHome - Score pronostiqué pour l'équipe à domicile
 * @param {number} predictedAway - Score pronostiqué pour l'équipe à l'extérieur
 * @param {number} actualHome - Score réel de l'équipe à domicile
 * @param {number} actualAway - Score réel de l'équipe à l'extérieur
 * @returns {number} Les points gagnés (0, 1, 3 ou 5)
 */
function calculatePoints(predictedHome, predictedAway, actualHome, actualAway) {
    // 1. Score exact
    if (predictedHome === actualHome && predictedAway === actualAway) {
        return 5;
    }

    // Détermination de l'issue du match (qui a gagné ou match nul)
    const predictedResult = Math.sign(predictedHome - predictedAway);
    const actualResult = Math.sign(actualHome - actualAway);

    // 2. Bon vainqueur (ou bon match nul)
    if (predictedResult === actualResult) {
        const predictedDiff = predictedHome - predictedAway;
        const actualDiff = actualHome - actualAway;

        // 2a. Bonne différence de buts
        if (predictedDiff === actualDiff) {
            return 3;
        }
        
        // 2b. Bon vainqueur mais mauvaise différence
        return 1;
    }

    // 3. Totalement faux
    return 0;
}

// On s'assure d'exporter un objet contenant la fonction
module.exports = { calculatePoints };