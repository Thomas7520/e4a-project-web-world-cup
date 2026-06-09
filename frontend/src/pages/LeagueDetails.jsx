import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function LeagueDetails() {
  const [searchParams] = useSearchParams();
  const leagueId = searchParams.get('id');
  
  const [league, setLeague] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!leagueId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/leagues/${leagueId}`);
        if (response.data) {
          setLeague(response.data.league);
          setLeaderboard(response.data.leaderboard || []);
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le classement. Vérifie que la table 'league_members' ou 'predictions' ne crash pas.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeagueData();
  }, [leagueId]);

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#64748b' }}>Chargement du classement MySQL...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
          ⚠️ ÉCHEC REQUÊTE : {error}
        </div>
      )}

      {league && (
        <div style={{ background: '#0f172a', color: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>🏆 {league.name}</h2>
              <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Créée par ID <strong>{league.owner_id}</strong>
              </p>
            </div>
            <div style={{ background: '#1e293b', border: '1px dashed #475569', padding: '10px 15px', borderRadius: '6px' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Code</span>
              <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>{league.invite_code}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 20px' }}>Rang</th>
              <th style={{ padding: '12px 20px' }}>Joueur</th>
              <th style={{ padding: '12px 20px', textAlign: 'center' }}>Pronos faits</th>
              <th style={{ padding: '12px 20px', textAlign: 'center' }}>Scores Exacts</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', paddingRight: '30px' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Aucun joueur ou erreur de calcul.</td>
              </tr>
            ) : (
              leaderboard.map((player, index) => (
                <tr key={player?.user_id || index} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: player?.username?.toLowerCase() === 'reda' ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{index + 1}</td>
                  <td style={{ padding: '15px 20px' }}>{player?.username}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>{player?.predictions_count}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center', color: '#10b981' }}>{player?.exact_scores_count}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', paddingRight: '30px', fontWeight: 'bold' }}>{player?.total_points} pts</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}