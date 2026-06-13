import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function MyPredictions() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/predictions/me');
        setHistory(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de joindre l'endpoint GET /api/predictions/me. Vérifie si la route existe dans le backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyHistory();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '25px' }}>📜 Mon Historique de Pronostics</h2>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
          ⚠️ EN DIRECT DE LA BDD : {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Vérification de l'historique sur MySQL...</p>
        ) : !error && history.length === 0 ? (
          <p style={{ color: '#64748b' }}>Tu n'as aucun pronostic enregistré pour le moment.</p>
        ) : (
          history.map((prono, idx) => (
            <div key={prono?.prediction_id || idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              {/* Colonne Gauche : Vrais noms et score réel */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>{prono.stage || "Match"}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', fontSize: '1.1rem', fontWeight: '500' }}>
                  {/* Pseudo ou Nom Réel du Pays A */}
                  <span>{prono.home_team_name || `Équipe ${prono.home_team_id}`}</span>
                  
                  {/* Score de la rencontre */}
                  <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', color: '#475569', fontWeight: 'bold', width : '5em', textAlign : 'center' }}>
                    {prono.actual_home ?? '?'} - {prono.actual_away ?? '?'}
                  </span>
                  
                  {/* Pseudo ou Nom Réel du Pays B */}
                  <span>{prono.away_team_name || `Équipe ${prono.away_team_id}`}</span>
                </div>
                <small style={{ color: '#64748b', display: 'block', marginTop: '6px' }}>
                  Match ID : {prono.match_id} • {prono.kickoff_at ? new Date(prono.kickoff_at).toLocaleDateString() : ''}
                </small>
              </div>

              {/* Colonne Centrale : Saisie utilisateur */}
              <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '0 10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Ton prono</span>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>{prono.predicted_home} - {prono.predicted_away}</strong>
              </div>

              {/* Colonne Droite : Points cumulés */}
              <div style={{ width: '120px', textAlign: 'right' }}>
                <div style={{ background: '#dbeafe', color: '#1d4ed8', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', minWidth: '70px', textAlign: 'center' }}>
                  +{prono.points_earned || 0} pts
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}