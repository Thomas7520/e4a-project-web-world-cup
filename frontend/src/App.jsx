import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Groups from './pages/Groups';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Stadiums from './pages/Stadiums';
import api from './services/api';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueDetails from './pages/LeagueDetails';
import PredictMatches from './pages/PredictMatches';
import MyPredictions from './pages/MyPredictions';
import News from './pages/News';

function AuthChecker() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const handling = useRef(false);

    const handleUnauth = (message) => {
        if (handling.current) return;
        handling.current = true;
        logout();
        const isDisabled = message?.includes('désactivé') || message?.includes('introuvable');
        addToast(isDisabled ? 'Votre compte a été désactivé' : 'Votre session a expiré, veuillez vous reconnecter', 'error');
        setTimeout(() => { handling.current = false; }, 3000);
    };

    // Vérifie l'auth à chaque changement de page
    useEffect(() => {
        if (!user) return;
        api.get('/auth/me').catch((err) => handleUnauth(err.response?.data?.message));
    }, [location.pathname]);

    // Écoute les 401 remontés par l'intercepteur axios
    useEffect(() => {
        const handler = (e) => { if (user) handleUnauth(e.detail?.message); };
        window.addEventListener('auth:unauthorized', handler);
        return () => window.removeEventListener('auth:unauthorized', handler);
    }, [user]);

    return null;
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AuthChecker />
                    <Header />
                    <Routes>
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin" element={
                            <AdminRoute>
                                <Admin />
                            </AdminRoute>
                        } />

                        {/* Routes de la Personne 2 */}
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:id" element={<TeamDetail />} />
                        <Route path="/groups" element={<Groups />} />
                        <Route path="/matches" element={<Matches />} />
                        <Route path="/matches/:id" element={<MatchDetail />} />
                        <Route path="/stadiums" element={<Stadiums />} />

                        {/* 🟢 TES ROUTES À TOI (Accessibles en tapant l'URL) */}
                        <Route path="/leagues" element={<Leagues />} />
                        <Route path="/create-league" element={<CreateLeague />} />
                        <Route path="/join-league" element={<JoinLeague />} />
                        <Route path="/league-details" element={<LeagueDetails />} />
                        <Route path="/predict" element={<PredictMatches />} />
                        <Route path="/my-predictions" element={<MyPredictions />} />
                        <Route path="/news" element={<News />} />

                        {/* On remplace l'accueil par ton Dashboard pour le voir direct ! */}
                        <Route path="/" element={<Dashboard />} /> 
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;