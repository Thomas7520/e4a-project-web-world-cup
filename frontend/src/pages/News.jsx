import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './News.css';

export default function News() {
    const [newsList, setNewsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get('/news')
            .then(res => setNewsList(Array.isArray(res.data) ? res.data : []))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="news-loading">Chargement des actualités...</div>;
    if (error)   return <div className="news-error">Impossible de charger les actualités.</div>;

    return (
        <div className="news-shell">
            <div className="news-header">
                <h1>Actualités</h1>
                <p>Suivez les dernières informations de la Coupe du Monde 2026.</p>
            </div>

            {newsList.length === 0 ? (
                <p className="news-empty">Aucune actualité publiée pour le moment.</p>
            ) : (
                <div className="news-list">
                    {newsList.map((item) => (
                        <article key={item.news_id} className="news-card">
                            {item.image_url && (
                                <div className="news-card-img">
                                    <img src={item.image_url} alt={item.title} />
                                </div>
                            )}
                            <div className="news-card-body">
                                <h2 className="news-card-title">{item.title}</h2>
                                <p className="news-card-content">{item.content}</p>
                                <div className="news-card-meta">
                                    <span>Par <strong>{item.author_name || 'La Rédaction'}</strong></span>
                                    <span>{item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
