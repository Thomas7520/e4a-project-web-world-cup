import React, { useState, useEffect } from 'react';
import api from '../services/api'; // 🔗 Utilisation de l'utilitaire Axios de ton équipe

export default function News() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/news');
        setNewsList(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Erreur 404 ou 500 : Impossible de charger les actualités depuis la table MySQL 'news'.");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const safeNewsList = Array.isArray(newsList) ? newsList : [];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>📰 Fil d'Actualités de la Coupe du Monde</h2>
        <p style={{ color: '#64748b', margin: '0' }}>Suis les dernières informations de la compétition.</p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontWeight: '500' }}>
          ⚠️ ÉCHEC SOURCE BDD : {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Chargement du fil info en direct de MySQL...</p>
        ) : !error && safeNewsList.length === 0 ? (
          <p style={{ color: '#64748b' }}>Aucune ligne trouvée dans la table 'news'.</p>
        ) : (
          safeNewsList.map((item, index) => (
            <article key={item?.news_id || item?.id || index} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '200px' }}>
              <div style={{ width: '250px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRight: '1px solid #e2e8f0', position: 'relative' }}>
                <span style={{ fontSize: '3rem' }}>⚽</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.4rem' }}>{item?.title}</h3>
                  <p style={{ margin: '0', color: '#475569', fontSize: '0.95rem' }}>{item?.content || item?.summary}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {/* ✍️ Affichage dynamique du vrai pseudo de l'auteur */}
                  <span>✍️ Par <strong>{item?.author_name || 'La Rédaction'}</strong></span>
                  <span>📅 {item?.published_at ? new Date(item.published_at).toLocaleDateString() : 'Récemment'}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}