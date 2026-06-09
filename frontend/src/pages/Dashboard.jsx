import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données réelles du tableau de bord.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleScoreChange = (matchId, team, value) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: value === "" ? "" : parseInt(value) || 0 }
    }));
  };

  const handlePredictionSubmit = async (e, matchId) => {
    e.preventDefault();
    const prono = predictions[matchId];
    if (!prono || prono.home === undefined || prono.away === undefined || prono.home === "" || prono.away === "") {
      alert("Veuillez entrer un score valide.");
      return;
    }
    
    try {
      await api.post('/predictions', {
        match_id: matchId,
        predicted_home_score: prono.home,
        predicted_away_score: prono.away
      });
      alert(`Pronostic enregistré pour le Match ${matchId} !`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du pronostic.");
    }
  };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Chargement en direct de la BDD...</div>;
  if (error) return <div style={{ padding: '20px', color: '#b91c1c' }}>⚠️ {error}</div>;

  const userSummary = data?.userSummary;
  const upcomingMatches = data?.upcomingMatches || [];
  const latestNews = data?.latestNews || [];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      <header style={{ background: '#1e293b', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Bienvenue, {userSummary?.username || 'Utilisateur'} ! 👋</h2>
        <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
          <div><strong>Points Totaux :</strong> {userSummary?.totalPoints} pts</div>
          <div><strong>Classement Général :</strong> {userSummary?.globalRank}e</div>
          <div><strong>Ligues Actives :</strong> {userSummary?.activeLeaguesCount}</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        <section>
          <h3>⚽ Prochains Matchs</h3>
          {upcomingMatches.length === 0 ? (
            <p style={{ color: '#64748b' }}>Aucun match enregistré dans la table 'matches'.</p>
          ) : (
            upcomingMatches.map(match => (
              <div key={match.match_id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>
                  Étape : <strong>{match.stage}</strong> • Statut : {match.status} • Kickoff : {match.kickoff_at ? new Date(match.kickoff_at).toLocaleString() : 'À venir'}
                </div>
                
                <form onSubmit={(e) => handlePredictionSubmit(e, match.match_id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '70%' }}>
                    {/* 🛠️ Remplacement par les vrais noms de pays mappés */}
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: '500' }}>{match.home_team_name}</span>
                    <input type="number" min="0" onChange={(e) => handleScoreChange(match.match_id, 'home', e.target.value)} style={{ width: '50px', padding: '5px', textAlign: 'center' }} />
                    <span style={{ color: '#94a3b8' }}>VS</span>
                    <input type="number" min="0" onChange={(e) => handleScoreChange(match.match_id, 'away', e.target.value)} style={{ width: '50px', padding: '5px', textAlign: 'center' }} />
                    <span style={{ flex: 1, fontWeight: '500' }}>{match.away_team_name}</span>
                  </div>
                  <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Valider</button>
                </form>
              </div>
            ))
          )}
        </section>

        <aside>
          <h3>📰 Dernières Actus BDD</h3>
          {latestNews.length === 0 ? (
            <p style={{ color: '#64748b' }}>Aucune actualité en base de données.</p>
          ) : (
            latestNews.map(news => (
              <div key={news.news_id} style={{ borderLeft: '4px solid #2563eb', padding: '10px 15px', background: '#f1f5f9', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{news.title}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155' }}>{news.content}</p>
              </div>
            ))
          )}
        </aside>

      </div>
    </div>
  );
}