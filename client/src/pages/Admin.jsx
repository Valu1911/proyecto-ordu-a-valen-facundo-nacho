import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shirt,
  Repeat,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { adminService } from '../services/adminService.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx';
import './Admin.css';

export function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [activityList, setActivityList] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'users' | 'reports' | 'activity'
  const [loading, setLoading] = useState(true);

  // Search & Filter users
  const [userSearch, setUserSearch] = useState('');

  // Ban Modal
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [banType, setBanType] = useState('temporary');
  const [banDays, setBanDays] = useState(7);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);

  // Resolve Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [targetReport, setTargetReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [dashData, usersData, reportsData, actData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getUsers(),
        adminService.getReports(),
        adminService.getActivityLog(),
      ]);

      setStats(dashData.stats);
      setUsersList(usersData.users || []);
      setReportsList(reportsData.reports || []);
      setActivityList(actData.activity || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    try {
      const data = await adminService.getUsers({ search: userSearch });
      setUsersList(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBanModal = (u) => {
    setTargetUser(u);
    setBanType('temporary');
    setBanDays(7);
    setBanReason('');
    setIsBanModalOpen(true);
  };

  const handleConfirmBan = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setBanLoading(true);

    try {
      await adminService.banUser(targetUser.id, {
        ban_type: banType,
        duration_days: banType === 'temporary' ? Number(banDays) : null,
        reason: banReason,
      });
      setIsBanModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al sancionar usuario');
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnbanUser = async (u) => {
    const reason = window.prompt(`Ingresá el motivo de reactivación para ${u.display_name}:`);
    if (!reason) return;

    try {
      await adminService.unbanUser(u.id, { reason });
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reactivar usuario');
    }
  };

  const handleResolveReport = async (report, status) => {
    try {
      await adminService.resolveReport(report.id, {
        status,
        admin_notes: `Reporte marcado como ${status} por moderador`,
      });
      loadAdminData();
    } catch (err) {
      alert('Error al actualizar reporte');
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" />;
  }

  return (
    <div className="container sv-admin-page">
      <div className="sv-admin-header">
        <div>
          <span className="badge badge-primary">MODERACIÓN ACTIVA</span>
          <h1 className="sv-admin-title">PANEL DE CONTROL ADMINISTRATIVO</h1>
          <p className="sv-admin-subtitle">
            Monitoreo en tiempo real de transacciones, cola de reportes y sanciones comunitarias.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="sv-admin-tabs">
          <button
            type="button"
            className={`sv-admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Métricas
          </button>
          <button
            type="button"
            className={`sv-admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuarios ({usersList.length})
          </button>
          <button
            type="button"
            className={`sv-admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reportes ({reportsList.length})
          </button>
          <button
            type="button"
            className={`sv-admin-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Auditoría
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && stats && (
        <div className="sv-admin-dashboard">
          <div className="sv-kpi-grid">
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon"><Users size={24} /></div>
              <span className="sv-kpi-label">USUARIOS REGISTRADOS</span>
              <strong className="sv-kpi-val">{stats.totalUsers}</strong>
            </div>
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon"><Shirt size={24} /></div>
              <span className="sv-kpi-label">PRENDAS ACTIVAS</span>
              <strong className="sv-kpi-val">{stats.totalProducts}</strong>
            </div>
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon"><Repeat size={24} /></div>
              <span className="sv-kpi-label">SWAPS EN CURSO (72H)</span>
              <strong className="sv-kpi-val">{stats.activeExchanges}</strong>
            </div>
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon sv-kpi-success"><CheckCircle size={24} /></div>
              <span className="sv-kpi-label">SWAPS COMPLETADOS</span>
              <strong className="sv-kpi-val">{stats.completedExchanges}</strong>
            </div>
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon sv-kpi-warning"><AlertTriangle size={24} /></div>
              <span className="sv-kpi-label">REPORTES PENDIENTES</span>
              <strong className="sv-kpi-val">{stats.pendingReports}</strong>
            </div>
            <div className="sv-kpi-card">
              <div className="sv-kpi-icon sv-kpi-danger"><UserX size={24} /></div>
              <span className="sv-kpi-label">USUARIOS SANCIONADOS</span>
              <strong className="sv-kpi-val">{stats.bannedUsers}</strong>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="sv-admin-section">
          <form onSubmit={handleSearchUsers} className="sv-admin-search-bar">
            <Input
              placeholder="Buscar por nombre o correo electrónico..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
            <Button type="submit" variant="secondary" size="md">
              Buscar
            </Button>
          </form>

          <div className="sv-table-wrapper">
            <table className="sv-admin-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Ciudad</th>
                  <th>Strikes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.display_name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.location_city || 'Buenos Aires'}</td>
                    <td>
                      <span className={u.strikes > 0 ? 'badge badge-warning' : ''}>
                        {u.strikes} / 3
                      </span>
                    </td>
                    <td>
                      {u.is_banned ? (
                        <span className="badge badge-danger">
                          {u.ban_type === 'permanent' ? 'Permanente' : 'Temporal'}
                        </span>
                      ) : (
                        <span className="badge badge-success">Activo</span>
                      )}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        u.is_banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(u)}
                          >
                            Reactivar
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenBanModal(u)}
                          >
                            Suspender
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="sv-admin-section">
          {reportsList.length === 0 ? (
            <div className="sv-admin-empty">
              <CheckCircle size={36} />
              <h3>Cola de reportes limpia</h3>
              <p>No hay denuncias pendientes de revisión en este momento.</p>
            </div>
          ) : (
            <div className="sv-reports-queue">
              {reportsList.map((rep) => (
                <div key={rep.id} className="sv-report-queue-card">
                  <div className="sv-report-card-top">
                    <div>
                      <span className="badge badge-danger">{rep.reason.toUpperCase()}</span>
                      <h4>Denuncia a: {rep.reportedUser?.display_name}</h4>
                      <p className="sv-report-by">Reportado por: {rep.reporter?.display_name}</p>
                    </div>
                    <span className={`badge ${rep.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                      {rep.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="sv-report-desc-box">"{rep.description}"</p>

                  <div className="sv-report-actions-row">
                    {rep.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveReport(rep, 'reviewed')}
                        >
                          Marcar Revisado
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResolveReport(rep, 'resolved')}
                        >
                          Resolver y Cerrar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenBanModal(rep.reportedUser)}
                        >
                          Sancionar Usuario
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY AUDIT TAB */}
      {activeTab === 'activity' && (
        <div className="sv-admin-section">
          <div className="sv-table-wrapper">
            <table className="sv-admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Usuario Afectado</th>
                  <th>Moderador</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {activityList.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${log.action.includes('ban') ? 'badge-danger' : 'badge-success'}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td><strong>{log.user?.display_name || log.user?.email}</strong></td>
                    <td>{log.admin?.display_name || 'Admin'}</td>
                    <td>{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      <Modal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        title={`Suspender a ${targetUser?.display_name}`}
        maxWidth="460px"
      >
        <form onSubmit={handleConfirmBan} className="sv-ban-form">
          <div className="sv-input-group">
            <label className="sv-input-label">Tipo de Suspensión</label>
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value)}
              className="sv-sort-select"
            >
              <option value="temporary">Suspensión Temporal</option>
              <option value="permanent">Suspensión Permanente</option>
            </select>
          </div>

          {banType === 'temporary' && (
            <div className="sv-input-group">
              <label className="sv-input-label">Duración en días</label>
              <select
                value={banDays}
                onChange={(e) => setBanDays(Number(e.target.value))}
                className="sv-sort-select"
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>
          )}

          <div className="sv-input-group">
            <label className="sv-input-label">Motivo de la Sanción (Obligatorio)</label>
            <textarea
              rows={3}
              placeholder="Explicá la razón de la suspensión para dejar asentado en la auditoría..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="sv-input-field"
              style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}
              required
            />
          </div>

          <div className="sv-ban-actions">
            <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" loading={banLoading}>
              Confirmar Suspensión
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
