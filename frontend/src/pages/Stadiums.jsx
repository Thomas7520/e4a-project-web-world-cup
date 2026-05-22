import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatNumber } from '../utils/formatters';
import './WorldCupPages.css';

export default function Stadiums() {
    const { addToast } = useToast();
    const [stadiums, setStadiums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStadiums = async () => {
            try {
                const res = await api.get('/stadiums');
                setStadiums(res.data.stadiums);
            } catch {
                addToast('Impossible de charger les stades', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchStadiums();
    }, []);

    return (
        <div className="page-content">
            <div className="wc-shell">
                <div className="wc-page-header">
                    <div>
                        <h1>Stades</h1>
                        <p>Les 16 enceintes de la Coupe du Monde 2026.</p>
                    </div>
                    <span className="wc-count">{stadiums.length} stade{stadiums.length > 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="wc-loading">Chargement des stades...</div>
                ) : stadiums.length === 0 ? (
                    <div className="wc-empty">Aucun stade disponible.</div>
                ) : (
                    <div className="wc-grid">
                        {stadiums.map((stadium) => (
                            <article className="wc-card" key={stadium.stadium_id}>
                                <h2>{stadium.name}</h2>
                                <div className="wc-meta">{stadium.city}, {stadium.country}</div>
                                <div className="wc-stadium-stats">
                                    <div>
                                        <span className="wc-info-label">Capacite</span>
                                        <span className="wc-info-value">{formatNumber(stadium.capacity)}</span>
                                    </div>
                                    <div>
                                        <span className="wc-info-label">Matchs</span>
                                        <span className="wc-info-value">{stadium.matches_count}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
