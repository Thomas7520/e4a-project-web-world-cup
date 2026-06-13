import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🛠️ Import pour la vraie navigation
import api from '../services/api'; // 🔗 Import de l'utilitaire Axios de ton équipe

export default function CreateLeague() {
  const navigate = useNavigate();
  const [leagueName, setLeagueName] = useState('');
  const [createdLeague, setCreatedLeague] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leagueName.trim()) return alert("Veuillez entrer un nom de ligue.");

    setIsSubmitting(true);

    try {
      // 🔥 VRAI APPEL API : Correspond au POST /leagues de ton backend
      const response = await api.post('/leagues', { name: leagueName.trim() });
      
      // Ton backend renvoie : { message, league: { id, name, invite_code } }
      if (response.data?.league) {
        setCreatedLeague(response.data.league);
      } else {
        throw new Error("Structure de réponse inattendue du serveur");
      }
    } catch (err) {
      console.error("Erreur lors de la création de la ligue :", err);
      const errorMsg = err.response?.data?.error || "Le serveur a refusé la création. Vérifie que tu es bien connecté.";
      alert(`Impossible de créer la ligue : ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (createdLeague) {
      navigator.clipboard.writeText(createdLeague.invite_code);
      alert("Code d'invitation copié dans le presse-papiers ! 📋");
    }
  };

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {!createdLeague ? (
          /* ÉTAPE A : Formulaire de création */
          <>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', textAlign: 'center' }}>🏆 Créer une nouvelle ligue</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', marginBottom: '25px' }}>
              Invite tes amis, suis leurs pronostics et découvre qui est le véritable expert du football !
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Nom de la ligue
                </label>
                <input 
                  type="text"
                  placeholder="ex: Les Magiciens du Ballon, Famille Foot..."
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  maxLength="50"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '1rem' }}
                  disabled={isSubmitting}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '1rem', transition: 'background 0.2s' }}
              >
                {isSubmitting ? 'Création en cours sur le serveur...' : 'Générer ma ligue privée ⚡'}
              </button>
            </form>
          </>
        ) : (
          /* ÉTAPE B : Succès et affichage du code d'invitation */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Ligue créée avec succès !</h2>
            <p style={{ color: '#475569', marginBottom: '25px' }}>
              La ligue <strong>"{createdLeague.name}"</strong> est prête à accueillir tes amis.
            </p>

            {/* Encadré du code d'invitation */}
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                Code d'invitation unique
              </span>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: '10px 0' }}>
                {createdLeague.invite_code}
              </div>
              <button 
                onClick={handleCopyCode}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
              >
                Copier le code 📋
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '25px' }}>
              Partage ce code avec tes proches. Ils pourront l'utiliser dans l'onglet "Rejoindre une ligue" pour intégrer ton classement.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setCreatedLeague(null)}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                Créer une autre ligue
              </button>
              
              <button 
                onClick={() => navigate(`/league-details?id=${createdLeague.id}`)}
                style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Accéder au Tableau 📊
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}