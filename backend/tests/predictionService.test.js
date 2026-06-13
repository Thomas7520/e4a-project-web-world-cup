// backend/tests/predictionService.test.js
const { calculatePoints } = require('../src/services/predictionService');

describe('Calcul des points de pronostics', () => {
    
    test('Score exact donne 5 points', () => {
        expect(calculatePoints(2, 1, 2, 1)).toBe(5);
        expect(calculatePoints(0, 0, 0, 0)).toBe(5);
    });

    test('Bon vainqueur + bonne différence de buts donne 3 points', () => {
        // Prono 3-1 (diff +2), Réel 2-0 (diff +2)
        expect(calculatePoints(3, 1, 2, 0)).toBe(3);
        // Prono 1-3 (diff -2), Réel 0-2 (diff -2)
        expect(calculatePoints(1, 3, 0, 2)).toBe(3);
    });

    test('Bon vainqueur donne 1 point', () => {
        // Prono 2-1 (diff +1), Réel 3-0 (diff +3)
        expect(calculatePoints(2, 1, 3, 0)).toBe(1);
        // Prono 1-2 (diff -1), Réel 0-3 (diff -3)
        expect(calculatePoints(1, 2, 0, 3)).toBe(1);
    });

    test('Mauvais vainqueur donne 0 point', () => {
        // Prono victoire domicile, Réel victoire extérieur
        expect(calculatePoints(2, 1, 1, 2)).toBe(0);
        // Prono victoire, Réel match nul
        expect(calculatePoints(1, 0, 1, 1)).toBe(0);
    });

    test('Match nul : si pas score exact, mais bien match nul, c\'est 3 points', () => {
        // Un match nul a toujours une différence de 0.
        expect(calculatePoints(1, 1, 2, 2)).toBe(3);
        expect(calculatePoints(0, 0, 3, 3)).toBe(3);
    });
});