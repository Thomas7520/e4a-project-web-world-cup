import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import Select from 'react-select';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Admin.css';

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, super_admin: 3 };
const ROLE_LABEL  = { user: 'Utilisateur', moderator: 'Modérateur', admin: 'Admin', super_admin: 'Super-admin' };
const STATUS_LABEL = { scheduled: 'Planifié', live: 'En cours', finished: 'Terminé', postponed: 'Reporté' };
const STAGE_LABEL  = {
    group: 'Groupes', round_of_32: '32e df', round_of_16: '16e df',
    quarter_final: 'Quarts', semi_final: 'Demis', third_place: '3e place', final: 'Finale',
};

const USER_PAGE_SIZE  = 10;
const MATCH_PAGE_SIZE = 20;

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconX = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const tableSelectStyles = {
    container: (base) => ({ ...base, width: '130px' }),
    control: (base, state) => ({
        ...base, minHeight: '32px', height: '32px', fontSize: '0.85rem',
        borderColor: state.isFocused ? '#0a2351' : '#dee2e6',
        boxShadow: state.isFocused ? '0 0 0 1px #0a2351' : 'none',
        borderRadius: '8px', cursor: 'pointer',
        '&:hover': { borderColor: '#0a2351' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0 8px', height: '32px' }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, padding: '0 6px' }),
    menu: (base) => ({ ...base, fontSize: '0.85rem', borderRadius: '8px', zIndex: 10, width: '130px' }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#0a2351' : state.isFocused ? '#f0f4f8' : 'white',
        color: state.isSelected ? 'white' : '#1a1a2e', cursor: 'pointer',
    }),
};

const modalSelectStyles = {
    container: (base) => ({ ...base, width: '100%' }),
    control: (base, state) => ({
        ...base, minHeight: '40px', fontSize: '0.95rem',
        borderColor: state.isFocused ? '#0a2351' : '#dee2e6',
        boxShadow: state.isFocused ? '0 0 0 1px #0a2351' : 'none',
        borderRadius: '8px', cursor: 'pointer',
        '&:hover': { borderColor: '#0a2351' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, padding: '0 6px' }),
    menu: (base) => ({ ...base, fontSize: '0.9rem', borderRadius: '8px', zIndex: 9999 }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#0a2351' : state.isFocused ? '#f0f4f8' : 'white',
        color: state.isSelected ? 'white' : '#1a1a2e', cursor: 'pointer',
    }),
};

const swalConfirm = (opts) => Swal.fire({
    showCancelButton: true,
    cancelButtonText: 'Annuler',
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
        popup: 'swal-popup', title: 'swal-title', htmlContainer: 'swal-text',
        confirmButton: `btn ${opts.confirmClass ?? 'btn-primary'}`,
        cancelButton: 'btn btn-outline', actions: 'swal-actions',
    },
    ...opts,
});

const toDatetimeLocal = (iso) => {
    if (!iso) return '';
    return new Date(iso).toISOString().slice(0, 16);
};

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export default function Admin() {
    const { user: me } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState('users');

    // --- Users ---
    const [users, setUsers]             = useState([]);
    const [total, setTotal]             = useState(0);
    const [totalPages, setTotalPages]   = useState(1);
    const [page, setPage]               = useState(1);
    const [search, setSearch]           = useState('');
    const [editUser, setEditUser]       = useState(null);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail]     = useState('');

    // --- Matches ---
    const [matches, setMatches]               = useState([]);
    const [matchTotal, setMatchTotal]         = useState(0);
    const [matchTotalPages, setMatchTotalPages] = useState(1);
    const [matchPage, setMatchPage]           = useState(1);
    const [matchSearch, setMatchSearch]       = useState('');
    const [matchStatusFilter, setMatchStatusFilter] = useState('');
    const [editMatch, setEditMatch]           = useState(null);
    const [stadiums, setStadiums]             = useState([]);
    const [editKickoffAt, setEditKickoffAt]   = useState('');
    const [editStadiumOpt, setEditStadiumOpt] = useState(null);
    const [editStatus, setEditStatus]         = useState('');
    const [editHomeScore, setEditHomeScore]   = useState('');
    const [editAwayScore, setEditAwayScore]   = useState('');
    const [editWinnerOpt, setEditWinnerOpt]   = useState(null);

    useLayoutEffect(() => {
        if (!editUser && !editMatch) return;
        const sw = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${sw}px`;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [editUser, editMatch]);

    // --- Users data ---
    const fetchUsers = useCallback(async (p = page, s = search) => {
        try {
            const res = await api.get('/admin/users', {
                params: { page: p, limit: USER_PAGE_SIZE, search: s || undefined },
            });
            setUsers(res.data.users);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch {
            addToast('Impossible de charger les utilisateurs', 'error');
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(page, search); }, [page]);

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
        fetchUsers(1, value);
    };

    // --- Matches data ---
    const fetchMatches = useCallback(async (p = matchPage, s = matchSearch, st = matchStatusFilter) => {
        try {
            const res = await api.get('/admin/matches', {
                params: { page: p, limit: MATCH_PAGE_SIZE, search: s || undefined, status: st || undefined },
            });
            setMatches(res.data.matches);
            setMatchTotal(res.data.total);
            setMatchTotalPages(res.data.totalPages);
        } catch {
            addToast('Impossible de charger les matchs', 'error');
        }
    }, [matchPage, matchSearch, matchStatusFilter]);

    useEffect(() => {
        if (activeTab === 'matches') fetchMatches(matchPage, matchSearch, matchStatusFilter);
    }, [activeTab, matchPage]);

    useEffect(() => {
        if (activeTab !== 'matches' || stadiums.length > 0) return;
        api.get('/stadiums').then(res => {
            const list = res.data.stadiums || res.data;
            setStadiums(list.map(s => ({ value: s.stadium_id, label: `${s.name} — ${s.city}` })));
        }).catch(() => {});
    }, [activeTab]);

    const handleMatchFilter = (s, st) => {
        setMatchSearch(s);
        setMatchStatusFilter(st);
        setMatchPage(1);
        fetchMatches(1, s, st);
    };

    // --- User handlers ---
    const handleToggleActive = async (u) => {
        const { isConfirmed } = await swalConfirm({
            title: `${u.is_active ? 'Désactiver' : 'Réactiver'} ${u.username} ?`,
            text: u.is_active ? 'Cet utilisateur ne pourra plus se connecter.' : 'Cet utilisateur pourra de nouveau se connecter.',
            confirmButtonText: u.is_active ? 'Désactiver' : 'Réactiver',
            confirmClass: u.is_active ? 'btn-danger' : 'btn-primary',
        });
        if (!isConfirmed) return;
        try {
            await api.put(`/admin/users/${u.user_id}/disable`);
            addToast(u.is_active ? 'Compte désactivé' : 'Compte réactivé');
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const handleRoleChange = async (u, newRole) => {
        try {
            await api.put(`/admin/users/${u.user_id}/promote`, { role: newRole });
            addToast(`Rôle mis à jour : ${ROLE_LABEL[newRole]}`);
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const openEdit = (u) => {
        setEditUser(u);
        setEditUsername(u.username);
        setEditEmail(u.email);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editUser.user_id}`, { username: editUsername, email: editEmail });
            addToast('Utilisateur mis à jour');
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    const handleDelete = async (u) => {
        const { isConfirmed } = await swalConfirm({
            title: `Supprimer ${u.username} ?`,
            text: 'Cette action est irréversible. Toutes les données de cet utilisateur seront perdues.',
            confirmButtonText: 'Supprimer',
            confirmClass: 'btn-danger',
        });
        if (!isConfirmed) return;
        try {
            await api.delete(`/admin/users/${u.user_id}`);
            addToast('Utilisateur supprimé');
            fetchUsers();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    // --- Match handlers ---
    const openEditMatch = (m) => {
        setEditMatch(m);
        setEditKickoffAt(toDatetimeLocal(m.kickoff_at));
        setEditStadiumOpt(m.stadium_id ? { value: m.stadium_id, label: `${m.stadium_name} — ${m.stadium_city}` } : null);
        setEditStatus(m.status);
        setEditHomeScore(m.home_score !== null ? String(m.home_score) : '');
        setEditAwayScore(m.away_score !== null ? String(m.away_score) : '');
        setEditWinnerOpt(null);
    };

    const handleMatchEditSubmit = async (e) => {
        e.preventDefault();
        const body = {
            kickoff_at: editKickoffAt || undefined,
            stadium_id: editStadiumOpt?.value ?? null,
            status: editStatus,
        };
        if (editHomeScore !== '' && editAwayScore !== '') {
            body.home_score = Number(editHomeScore);
            body.away_score = Number(editAwayScore);
        }
        if (editWinnerOpt) body.winner_team_id = editWinnerOpt.value;

        try {
            await api.put(`/admin/matches/${editMatch.match_id}`, body);
            addToast('Match mis à jour');
            setEditMatch(null);
            fetchMatches();
        } catch (err) {
            addToast(err.response?.data?.message || 'Erreur', 'error');
        }
    };

    // --- Permissions ---
    const canToggleActive = (u) => u.user_id !== me.user_id && ROLE_LEVEL[me.role] > ROLE_LEVEL[u.role];
    const canChangeRole   = (u) => u.user_id !== me.user_id && ['admin', 'super_admin'].includes(me.role) && ROLE_LEVEL[me.role] > ROLE_LEVEL[u.role];
    const availableRoles  = (u) => Object.keys(ROLE_LEVEL).filter(r => r !== 'super_admin' && ROLE_LEVEL[r] < ROLE_LEVEL[me.role] && r !== u.role);
    const canEdit         = (u) => u.user_id !== me.user_id && ['admin', 'super_admin'].includes(me.role);
    const canDelete       = (u) => me.role === 'super_admin' && u.user_id !== me.user_id && u.role !== 'super_admin';

    const isKnockout    = editMatch?.stage !== 'group';
    const winnerOptions = editMatch ? [
        { value: editMatch.home_team_id, label: editMatch.home_team_name },
        { value: editMatch.away_team_id, label: editMatch.away_team_name },
    ] : [];

    return (
        <div className="page-content">
            <div className="admin-tabs">
                <button className={`admin-tab${activeTab === 'users' ? ' active' : ''}`} onClick={() => setActiveTab('users')}>
                    Utilisateurs
                </button>
                <button className={`admin-tab${activeTab === 'matches' ? ' active' : ''}`} onClick={() => setActiveTab('matches')}>
                    Matchs
                </button>
            </div>

            {/* ===== ONGLET UTILISATEURS ===== */}
            {activeTab === 'users' && (
                <>
                    <div className="admin-header">
                        <h2>Utilisateurs</h2>
                        <span className="admin-count">{total} utilisateur{total > 1 ? 's' : ''}</span>
                    </div>

                    <input
                        type="search"
                        className="admin-search"
                        placeholder="Rechercher par nom ou email..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom d'utilisateur</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Actif</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.user_id} className={!u.is_active ? 'inactive' : ''}>
                                        <td>{u.user_id}</td>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                                        <td>{u.is_active ? <IconCheck /> : <IconX />}</td>
                                        <td className="admin-actions">
                                            {canToggleActive(u) && (
                                                <button onClick={() => handleToggleActive(u)} className="btn btn-outline btn-sm">
                                                    {u.is_active ? 'Désactiver' : 'Réactiver'}
                                                </button>
                                            )}
                                            {canChangeRole(u) && (
                                                <Select
                                                    value={{ value: u.role, label: ROLE_LABEL[u.role] }}
                                                    options={[
                                                        { value: u.role, label: ROLE_LABEL[u.role] },
                                                        ...availableRoles(u).map(r => ({ value: r, label: ROLE_LABEL[r] })),
                                                    ]}
                                                    onChange={(opt) => handleRoleChange(u, opt.value)}
                                                    styles={tableSelectStyles}
                                                    isSearchable={false}
                                                    menuPosition="fixed"
                                                />
                                            )}
                                            {canEdit(u) && (
                                                <button onClick={() => openEdit(u)} className="btn btn-outline btn-sm">
                                                    Modifier
                                                </button>
                                            )}
                                            {canDelete(u) && (
                                                <button onClick={() => handleDelete(u)} className="btn btn-danger btn-sm">
                                                    Supprimer
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Précédent</button>
                            <span className="pagination-info">Page {page} / {totalPages}</span>
                            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Suivant →</button>
                        </div>
                    )}
                </>
            )}

            {/* ===== ONGLET MATCHS ===== */}
            {activeTab === 'matches' && (
                <>
                    <div className="admin-header">
                        <h2>Matchs</h2>
                        <span className="admin-count">{matchTotal} match{matchTotal > 1 ? 's' : ''}</span>
                    </div>

                    <div className="admin-filters">
                        <input
                            type="search"
                            className="admin-search admin-search--inline"
                            placeholder="Rechercher une équipe..."
                            value={matchSearch}
                            onChange={(e) => handleMatchFilter(e.target.value, matchStatusFilter)}
                        />
                        <select
                            className="filter-select"
                            value={matchStatusFilter}
                            onChange={(e) => handleMatchFilter(matchSearch, e.target.value)}
                        >
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>N°</th>
                                    <th>Date</th>
                                    <th>Match</th>
                                    <th>Phase</th>
                                    <th>Statut</th>
                                    <th>Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((m) => (
                                    <tr key={m.match_id}>
                                        <td>{m.match_number}</td>
                                        <td className="nowrap">{formatDate(m.kickoff_at)}</td>
                                        <td>{m.home_team_name} vs {m.away_team_name}</td>
                                        <td className="nowrap">{STAGE_LABEL[m.stage] ?? m.stage}</td>
                                        <td>
                                            <span className={`status-badge status-${m.status}`}>
                                                {STATUS_LABEL[m.status] ?? m.status}
                                            </span>
                                        </td>
                                        <td className="nowrap">
                                            {m.home_score !== null && m.away_score !== null
                                                ? `${m.home_score} - ${m.away_score}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <button onClick={() => openEditMatch(m)} className="btn btn-outline btn-sm">
                                                Modifier
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {matchTotalPages > 1 && (
                        <div className="admin-pagination">
                            <button className="btn btn-outline btn-sm" onClick={() => setMatchPage(p => p - 1)} disabled={matchPage === 1}>← Précédent</button>
                            <span className="pagination-info">Page {matchPage} / {matchTotalPages}</span>
                            <button className="btn btn-outline btn-sm" onClick={() => setMatchPage(p => p + 1)} disabled={matchPage === matchTotalPages}>Suivant →</button>
                        </div>
                    )}
                </>
            )}

            {/* ===== MODAL MODIFIER UTILISATEUR ===== */}
            {editUser && createPortal(
                <div className="modal-backdrop modal-backdrop--center" onClick={() => setEditUser(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <h2>Modifier {editUser.username}</h2>
                            <div className="form-group">
                                <label>Nom d'utilisateur</label>
                                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required minLength={3} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                                <button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* ===== MODAL MODIFIER MATCH ===== */}
            {editMatch && createPortal(
                <div className="modal-backdrop modal-backdrop--center" onClick={() => setEditMatch(null)}>
                    <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleMatchEditSubmit} className="modal-form">
                            <h2>Match #{editMatch.match_number}</h2>
                            <p className="modal-match-title">{editMatch.home_team_name} vs {editMatch.away_team_name}</p>

                            <div className="form-group">
                                <label>Date et heure</label>
                                <input
                                    type="datetime-local"
                                    value={editKickoffAt}
                                    onChange={(e) => setEditKickoffAt(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Stade</label>
                                <Select
                                    value={editStadiumOpt}
                                    options={stadiums}
                                    onChange={setEditStadiumOpt}
                                    styles={modalSelectStyles}
                                    isClearable
                                    isSearchable
                                    placeholder="Sélectionner un stade..."
                                    menuPosition="fixed"
                                    noOptionsMessage={() => 'Aucun stade trouvé'}
                                />
                            </div>

                            <div className="form-group">
                                <label>Statut</label>
                                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} required>
                                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label-truncate">Score — {editMatch.home_team_name}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editHomeScore}
                                        onChange={(e) => setEditHomeScore(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label-truncate">Score — {editMatch.away_team_name}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editAwayScore}
                                        onChange={(e) => setEditAwayScore(e.target.value)}
                                        placeholder="—"
                                    />
                                </div>
                            </div>

                            {isKnockout && editStatus === 'finished' && (
                                <div className="form-group">
                                    <label>Vainqueur <span className="label-hint">(obligatoire si égalité)</span></label>
                                    <Select
                                        value={editWinnerOpt}
                                        options={winnerOptions}
                                        onChange={setEditWinnerOpt}
                                        styles={modalSelectStyles}
                                        isClearable
                                        placeholder="Automatique si score différent..."
                                        menuPosition="fixed"
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Enregistrer</button>
                                <button type="button" className="btn btn-outline" onClick={() => setEditMatch(null)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
