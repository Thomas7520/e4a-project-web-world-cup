import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function JoinLeague() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinedLeague, setJoinedLeague] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim() || inviteCode.trim().length !== 8) {
      return alert("Veuillez entrer un code d'invitation valide à 8 caractères.");
    }

    setIsSubmitting(true);

    try {
      const joinResponse = await api.post('/leagues/join', { 
        invite_code: inviteCode.trim().toUpperCase() 
      });
      
      const newLeagueId = joinResponse.data?.league_id;

      if (newLeagueId) {
        const detailsResponse = await api.get(`/leagues/${newLeagueId}`);
        
        setJoinedLeague({
          id: newLeagueId,
          name: detailsResponse.data?.league?.name || "Ligue Rejointe",
          owner_name: detailsResponse.data?.league?.owner_name || "Un ami"
        });
        
        setInviteCode('');
      } else {
        throw new Error("ID de ligue manquant dans la réponse");
      }

    } catch (err) {
      console.error("Erreur lors de l'adhésion à la ligue :", err);
      const errorMsg = err.response?.data?.error || "Code invalide, ligue introuvable ou tu as déjà rejoint cette ligue.";
      alert(`Impossible de rejoindre : ${errorMsg}`);
    } {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {!joinedLeague ? (
          /* ÉTAPE A : Formulaire de saisie du code */
          <>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', textAlign: 'center' }}>🔗 Rejoindre une ligue privée</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', marginBottom: '25px' }}>
              Un ami t'a partagé un code ? Entre-le ci-dessous pour rejoindre sa ligue et comparer tes pronostics avec les siens !
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Code d'invitation
                </label>
                <input 
                  type="text"
                  placeholder="Ex : A1B2C3D4"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  maxLength="8"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid #cbd5e1', 
                    boxSizing: 'border-box', 
                    fontSize: '1.2rem', 
                    letterSpacing: '3px', 
                    textAlign: 'center', 
                    textTransform: 'uppercase',
                    fontFamily: 'monospace'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  background: '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  padding: '14px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  width: '100%', 
                  fontSize: '1rem', 
                  transition: 'background 0.2s' 
                }}
              >
                {isSubmitting ? 'Vérification du code sur la base SQL...' : 'Rejoindre la compétition 🚀'}
              </button>
            </form>
          </>
        ) : (
          /* ÉTAPE B : Succès - L'utilisateur a rejoint la ligue */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏃‍♂️💨</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>Ligue rejointe !</h2>
            <p style={{ color: '#475569', marginBottom: '25px', fontSize: '1.05rem' }}>
              Tu as intégré la ligue <strong>"{joinedLeague.name}"</strong> créée par <strong>{joinedLeague.owner_name}</strong>.
            </p>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '8px', marginBottom: '25px', color: '#166534', fontSize: '0.95rem' }}>
              ⚽ Tes pronostics actuels sont désormais visibles par les membres de cette ligue. Que le meilleur gagne !
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setJoinedLeague(null)}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                Rejoindre une autre ligue
              </button>
              
              <button 
                onClick={() => navigate(`/league-details?id=${joinedLeague.id}`)}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Voir le Classement 📊
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}