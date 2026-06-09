import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // 🔗 Utilisation de l'utilitaire Axios de ton équipe

export default function Leagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔄 Charger tes vraies ligues depuis la BDD au démarrage
  const fetchMyLeagues = async () => {
    try {
      setLoading(true);
      // Appelle ton endpoint GET /api/leagues/me
      const response = await api.get('/leagues/me');
      setLeagues(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des ligues :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeagues();
  }, []);

  // ➕ Gérer la création d'une vraie ligue (POST /api/leagues)
  const handleCreateLeague = async (e) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return alert("Donne un nom à ta ligue !");

    try {
      const response = await api.post('/leagues', { name: newLeagueName.trim() });
      alert(response.data.message || "Ligue créée !");
      setNewLeagueName('');
      fetchMyLeagues(); // Recharger la liste instantanément depuis la BDD
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de la création.";
      alert(`Impossible de créer la ligue : ${errorMsg}`);
    }
  };

  // 🔗 Gérer l'action de rejoindre une vraie ligue (POST /api/leagues/join)
  const handleJoinLeague = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return alert("Entre un code d'invitation !");

    try {
      const response = await api.post('/leagues/join', { invite_code: inviteCode.trim().toUpperCase() });
      alert(response.data.message || "Ligue rejointe !");
      setInviteCode('');
      fetchMyLeagues(); // Recharger la liste actualisée
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Code invalide ou ligue déjà rejointe.";
      alert(`Impossible de rejoindre : ${errorMsg}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>🏆 Gestion de mes Ligues Privées</h2>

      {/* Zone Actions : Créer ou Rejoindre */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Formulaire Créer */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>➕ Créer une ligue</h3>
          <form onSubmit={handleCreateLeague}>
            <input 
              type="text" 
              placeholder="Nom de la ligue (ex: Les Amis du Foot)"
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              Créer la ligue
            </button>
          </form>
        </div>

        {/* Formulaire Rejoindre */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🔗 Rejoindre une ligue</h3>
          <form onSubmit={handleJoinLeague}>
            <input 
              type="text" 
              placeholder="Code d'invitation (ex: A1B2C3D4)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              maxLength="8"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', textTransform: 'uppercase' }}
            />
            <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              Rejoindre la ligue
            </button>
          </form>
        </div>

      </div>

      {/* Liste des ligues actuelles */}
      <section>
        <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>📋 Les ligues dont je fais partie ({leagues.length})</h3>
        
        {loading ? (
          <p style={{ color: '#64748b' }}>Chargement de vos ligues depuis le serveur...</p>
        ) : leagues.length === 0 ? (
          <p style={{ color: '#64748b' }}>Tu ne fais partie d'aucune ligue pour le moment. Crée-en une ou rejoins-en une !</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {leagues.map(league => {
              const currentId = league.league_id;
              const currentCode = league.invite_code || 'N/A';
              const currentMembers = league.member_count || 1;
              const currentDate = league.created_at;

              return (
                <div key={currentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.2rem' }}>{league.name}</h4>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      👥 <strong>{currentMembers} membres</strong> • Créée le {currentDate ? new Date(currentDate).toLocaleDateString() : 'Récemment'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Badge Code Invitation */}
                    <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '1rem', color: '#334155' }}>
                      Code : <strong>{currentCode}</strong>
                    </div>
                    
                    {/* Bouton pour aller voir le classement de cette ligue */}
                    <button 
                      onClick={() => navigate(`/league-details?id=${currentId}`)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Voir le Classement 📊
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}