import React, { useState, useEffect } from 'react';
import api from '../services/api'; // 🔗 Utilisation de l'utilitaire Axios de ton équipe

export default function PredictMatches() {
  const [matches, setMatches] = useState([]);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 Charger les vrais matchs depuis MySQL au démarrage
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/matches');
        
        // 🛠️ CORRECTIF DIRECT : On extrait le tableau depuis "response.data.matches"
        setMatches(response.data.matches || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des matchs :", err);
        setError("Impossible de charger la liste des matchs depuis la base de données. Vérifie la connexion de ton serveur backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleInputChange = (matchId, team, value) => {
    setInputs(prev => ({
      ...prev,
      [matchId]: { 
        ...prev[matchId], 
        [team]: value === "" ? "" : parseInt(value) || 0 
      }
    }));
  };

  // 💾 Enregistrer le pronostic en direct dans MySQL
  const handleSaveProno = async (e, matchId) => {
    e.preventDefault();
    const score = inputs[matchId];
    
    if (!score || score.home === undefined || score.away === undefined || score.home === "" || score.away === "") {
      return alert("Veuillez entrer un score valide avant d'enregistrer !");
    }

    try {
      // 🔥 Envoi des clés exactes attendues par votre table SQL
      await api.post('/predictions', { 
        match_id: matchId, 
        predicted_home_score: score.home, 
        predicted_away_score: score.away 
      });
      
      alert("Pronostic enregistré avec succès ! 🚀");

      // Mise à jour visuelle locale du bouton
      setMatches(prevMatches => 
        prevMatches.map(m => m.match_id === matchId ? { ...m, has_predicted: true } : m)
      );
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du pronostic :", err);
      alert("Erreur serveur : Impossible d'insérer la ligne dans la table 'predictions'.");
    }
  };

  const safeMatches = Array.isArray(matches) ? matches : [];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '25px' }}>🎯 Grille des Pronostics Réels</h2>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontWeight: '500' }}>
          ⚠️ ÉCHEC SOURCE BDD : {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Lecture des lignes de la table 'matches'...</p>
        ) : !error && safeMatches.length === 0 ? (
          <p style={{ color: '#64748b' }}>Aucun match enregistré pour le moment dans la table SQL 'matches'.</p>
        ) : (
          safeMatches.map((match) => {
            const id = match.match_id;
            
            // Alignement des valeurs sur l'authentique retour SQL de l'équipe
            const evaluationHome = match.predicted_home_score;
            const evaluationAway = match.predicted_away_score;
            const hasProno = match.has_predicted || (evaluationHome !== undefined && evaluationHome !== null);

            return (
              <div key={id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                
                {/* Infos réelles issues des jointures du contrôleur */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span>🏆 Étape : <strong>{match.stage}</strong> • 🏟️ {match.stadium_name} ({match.stadium_city})</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    📅 {match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : 'Date à venir'}
                  </span>
                </div>

                <form onSubmit={(e) => handleSaveProno(e, id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
                    
                    {/* Vrai nom de l'Équipe 1 */}
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '180px', textAlign: 'right' }}>
                      {match.home_team_name}
                    </span>
                    
                    <input 
                      type="number" 
                      min="0" 
                      placeholder={hasProno ? String(evaluationHome) : "-"}
                      onChange={(e) => handleInputChange(id, 'home', e.target.value)} 
                      style={{ width: '50px', padding: '10px', fontSize: '1.2rem', textAlign: 'center', borderRadius: '6px', border: '2px solid #cbd5e1' }} 
                    />
                    
                    <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '1.2rem' }}>-</span>
                    
                    <input 
                      type="number" 
                      min="0" 
                      placeholder={hasProno ? String(evaluationAway) : "-"}
                      onChange={(e) => handleInputChange(id, 'away', e.target.value)} 
                      style={{ width: '50px', padding: '10px', fontSize: '1.2rem', textAlign: 'center', borderRadius: '6px', border: '2px solid #cbd5e1' }} 
                    />
                    
                    {/* Vrai nom de l'Équipe 2 */}
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '180px', textAlign: 'left' }}>
                      {match.away_team_name}
                    </span>
                  </div>

                  <div style={{ width: '130px', textAlign: 'right' }}>
                    <button 
                      type="submit" 
                      style={{ 
                        background: hasProno ? '#10b981' : '#2563eb', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 15px', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        width: '100%'
                      }}
                    >
                      {hasProno ? 'Modifier ✓' : 'Enregistrer'}
                    </button>
                  </div>
                </form>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}