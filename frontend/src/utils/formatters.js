export const formatDateTime = (value) => {
    if (!value) return 'Date a confirmer';
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export const formatDate = (value) => {
    if (!value) return 'Date a confirmer';
    return new Date(value).toLocaleDateString('fr-FR', {
        dateStyle: 'medium',
    });
};

export const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('fr-FR');
};

export const positionLabel = {
    goalkeeper: 'Gardien',
    defender: 'Defenseur',
    midfielder: 'Milieu',
    forward: 'Attaquant',
};

export const statusLabel = {
    scheduled: 'Planifie',
    live: 'En direct',
    finished: 'Termine',
    postponed: 'Reporte',
};

export const stageLabel = {
    group: 'Phase de groupes',
    round_of_32: '32es de finale',
    round_of_16: '8es de finale',
    quarter_final: 'Quart de finale',
    semi_final: 'Demi-finale',
    third_place: 'Petite finale',
    final: 'Finale',
};
