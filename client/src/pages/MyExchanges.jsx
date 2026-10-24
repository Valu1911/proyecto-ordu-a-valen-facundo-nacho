import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  MessageSquare,
  Star,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { exchangeService } from '../services/exchangeService.js';
import { useAuthStore } from '../store/authStore.js';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { StarRating } from '../components/ui/StarRating.jsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx';
import { Input } from '../components/ui/Input.jsx';
import api from '../services/api.js';
import './MyExchanges.css';

export function MyExchanges() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'history'

  // Confirm Modal
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');

  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Copy code feedback
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const data = await exchangeService.getMyExchanges();
      setExchanges(data.exchanges || []);
    } catch (err) {
      console.error('Error loading exchanges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    fetchExchanges();
  }, [isAuthenticated]);

  const handleAccept = async (id) => {
    try {
      await exchangeService.acceptExchange(id);
      fetchExchanges();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al aceptar intercambio.');
    }
  };

  const handleReject = async (id) => {
    try {
      await exchangeService.rejectExchange(id);
      fetchExchanges();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al rechazar intercambio.');
    }
  };

  const handleFormalize = async (id) => {
    try {
      await exchangeService.formalizeExchange(id);
      fetchExchanges();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al formalizar intercambio.');
    }
  };

  const handleOpenConfirmModal = (ex) => {
    setSelectedExchange(ex);
    setInputCode('');
    setConfirmError('');
    setConfirmSuccess('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExchange) return;
    setActionLoading(true);
    setConfirmError('');
    setConfirmSuccess('');

    try {
      await exchangeService.confirmExchange(selectedExchange.id, inputCode.toUpperCase().trim());
      setConfirmSuccess('¡Entrega validada con éxito! El intercambio quedó completado.');
      setTimeout(() => {
        setIsConfirmModalOpen(false);
        fetchExchanges();
      }, 1200);
    } catch (err) {
      setConfirmError(err.response?.data?.error || 'Código incorrecto o plazo de intercambio vencido.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = (ex) => {
    setSelectedExchange(ex);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewSuccess('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setActionLoading(true);

    try {
      await api.post('/reviews', {
        exchange_id: selectedExchange.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess('¡Calificación enviada con éxito! Gracias por sumar confianza a la comunidad.');
      setTimeout(() => {
        setIsReviewModalOpen(false);
        fetchExchanges();
      }, 1200);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Error al enviar calificación.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = (code, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  // Filter exchanges by tab
  const activeExchanges = exchanges.filter((ex) =>
    ['pending', 'accepted', 'formalized'].includes(ex.status)
  );
  const completedExchanges = exchanges.filter((ex) => ex.status === 'completed');
  const historyExchanges = exchanges.filter((ex) =>
    ['rejected', 'cancelled', 'expired'].includes(ex.status)
  );

  const currentList =
    activeTab === 'active'
      ? activeExchanges
      : activeTab === 'completed'
      ? completedExchanges
      : historyExchanges;

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" />;
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'PROPUESTA PENDIENTE';
      case 'accepted': return 'ACEPTADO â€¢ POR FORMALIZAR';
      case 'formalized': return 'FORMALIZADO â€¢ EN 72HS';
      case 'completed': return 'CONCRETADO CON ÉXITO';
      case 'rejected': return 'PROPUESTA RECHAZADA';
      case 'cancelled': return 'CANCELADO';
      case 'expired': return 'PLAZO VENCIDO';
      default: return status?.toUpperCase() || 'ACTIVO';
    }
  };

  return (
    <div className="container sv-exchanges-page animate-fade-in">
      <div className="sv-exchanges-header">
        <div>
          <h1 className="sv-exchanges-title">MIS INTERCAMBIOS</h1>
          <p className="sv-exchanges-subtitle">
            Gestioná tus propuestas activas, coordiná por chat y validá la entrega con el código seguro de 72 horas.
          </p>
        </div>

        <div className="sv-exchanges-tabs">
          <button
            type="button"
            className={`sv-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span>Activos</span>
            {activeExchanges.length > 0 && <span className="sv-tab-badge">{activeExchanges.length}</span>}
          </button>
          <button
            type="button"
            className={`sv-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <span>Completados</span>
            {completedExchanges.length > 0 && <span className="sv-tab-badge">{completedExchanges.length}</span>}
          </button>
          <button
            type="button"
            className={`sv-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span>Historial</span>
            {historyExchanges.length > 0 && <span className="sv-tab-badge">{historyExchanges.length}</span>}
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <div className="sv-exchanges-empty animate-fade-in">
          <div className="sv-empty-icon">
            <Repeat size={38} />
          </div>
          <h3>No tenés intercambios en esta sección</h3>
          <p>Explorá las prendas de la comunidad en el catálogo y proponé tu primer intercambio sin costo.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/catalogo')}>
            Ir al Catálogo de Prendas
          </Button>
        </div>
      ) : (
        <div className="sv-exchanges-list animate-fade-in">
          {currentList.map((ex) => {
            const isRequester = ex.requester_id === user?.id;
            const otherUser = isRequester ? ex.owner : ex.requester;
            const requestedItem = ex.productRequested;
            const offeredItem = ex.productOffered;

            let reqImgs = [];
            try {
              reqImgs = typeof requestedItem?.images === 'string' ? JSON.parse(requestedItem.images) : requestedItem?.images;
            } catch {}

            let offImgs = [];
            try {
              offImgs = typeof offeredItem?.images === 'string' ? JSON.parse(offeredItem?.images) : offeredItem?.images;
            } catch {}

            return (
              <div key={ex.id} className={`sv-exchange-card status-${ex.status}`}>
                {/* Header status bar */}
                <div className="sv-exchange-card-header">
                  <div className="sv-exchange-partner">
                    <Avatar src={otherUser?.avatar_url} alt={otherUser?.display_name || 'Usuario'} size="sm" />
                    <div>
                      <span className="sv-partner-role">
                        {isRequester ? 'Propuesta enviada a:' : 'Propuesta recibida de:'}
                      </span>
                      <p className="sv-partner-name">{otherUser?.display_name || 'Miembro de Segunda Vuelta'}</p>
                    </div>
                  </div>

                  <div className="sv-exchange-badge-area">
                    <span className={`sv-status-pill status-${ex.status}`}>
                      {getStatusLabel(ex.status)}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="sv-exchange-stepper">
                  <div className={`sv-stepper-step ${['pending', 'accepted', 'formalized', 'completed'].includes(ex.status) ? 'step-done' : ''}`}>
                    <span className="sv-step-dot" />
                    <span className="sv-step-text">Propuesto</span>
                  </div>
                  <div className="sv-stepper-line" />
                  <div className={`sv-stepper-step ${['accepted', 'formalized', 'completed'].includes(ex.status) ? 'step-done' : ''}`}>
                    <span className="sv-step-dot" />
                    <span className="sv-step-text">Aceptado</span>
                  </div>
                  <div className="sv-stepper-line" />
                  <div className={`sv-stepper-step ${['formalized', 'completed'].includes(ex.status) ? 'step-done' : ''}`}>
                    <span className="sv-step-dot" />
                    <span className="sv-step-text">En 72hs</span>
                  </div>
                  <div className="sv-stepper-line" />
                  <div className={`sv-stepper-step ${ex.status === 'completed' ? 'step-done' : ''}`}>
                    <span className="sv-step-dot" />
                    <span className="sv-step-text">Concretado</span>
                  </div>
                </div>

                {/* Garments preview comparison */}
                <div className="sv-exchange-items-row">
                  <div className="sv-exchange-item-col">
                    <span className="sv-item-col-label">PRENDA SOLICITADA</span>
                    <div
                      className="sv-exchange-item-preview"
                      onClick={() => requestedItem?.id && navigate(`/prenda/${requestedItem.id}`)}
                    >
                      <img
                        src={reqImgs?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                        alt={requestedItem?.title || ''}
                      />
                      <div>
                        <h4>{requestedItem?.title || 'Prenda'}</h4>
                        <p>Talle: {requestedItem?.size?.toUpperCase()} â€¢ {requestedItem?.condition}</p>
                      </div>
                    </div>
                  </div>

                  <div className="sv-exchange-vs-divider">
                    <Repeat size={18} />
                  </div>

                  <div className="sv-exchange-item-col">
                    <span className="sv-item-col-label">PRENDA OFRECIDA</span>
                    {offeredItem ? (
                      <div
                        className="sv-exchange-item-preview"
                        onClick={() => offeredItem?.id && navigate(`/prenda/${offeredItem.id}`)}
                      >
                        <img
                          src={offImgs?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'}
                          alt={offeredItem?.title || ''}
                        />
                        <div>
                          <h4>{offeredItem?.title || 'Prenda ofrecida'}</h4>
                          <p>Talle: {offeredItem?.size?.toUpperCase()} â€¢ {offeredItem?.condition}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="sv-exchange-no-offer">
                        <p>A acordar por el chat directo</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 72h Formalized Banner with OTP code */}
                {ex.status === 'formalized' && (
                  <div className="sv-formalized-banner">
                    <div className="sv-code-display-box">
                      <KeyRound size={22} className="sv-code-key-icon" />
                      <div>
                        <span className="sv-code-label">CÓDIGO DE VALIDACIÓN PRESENCIAL</span>
                        <div className="sv-code-row">
                          <strong className="sv-code-text">{ex.exchange_code || '********'}</strong>
                          {ex.exchange_code && (
                            <button
                              type="button"
                              className="sv-code-copy-btn"
                              onClick={() => copyCode(ex.exchange_code, ex.id)}
                              title="Copiar código"
                              aria-label="Copiar código"
                            >
                              {copiedCodeId === ex.id ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedCodeId === ex.id ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sv-timer-box">
                      <Clock size={16} />
                      <span>Plazo límite de 72 horas para encontrarse y validar</span>
                    </div>
                  </div>
                )}

                {/* Actions footer */}
                <div className="sv-exchange-card-footer">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/chat')}
                  >
                    <MessageSquare size={15} />
                    <span>Abrir Conversación</span>
                  </Button>

                  {/* If pending and I am the owner */}
                  {!isRequester && ex.status === 'pending' && (
                    <div className="sv-action-buttons-group">
                      <Button variant="outline" size="sm" onClick={() => handleReject(ex.id)}>
                        Rechazar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleAccept(ex.id)}>
                        Aceptar Propuesta
                      </Button>
                    </div>
                  )}

                  {/* If accepted, both can formalize */}
                  {ex.status === 'accepted' && (
                    <Button variant="primary" size="sm" onClick={() => handleFormalize(ex.id)}>
                      <ShieldCheck size={15} />
                      <span>Formalizar (Iniciar 72hs)</span>
                    </Button>
                  )}

                  {/* If formalized, confirm reception */}
                  {ex.status === 'formalized' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenConfirmModal(ex)}
                    >
                      <CheckCircle2 size={15} />
                      <span>Validar Entrega con Código</span>
                    </Button>
                  )}

                  {/* If completed, leave review */}
                  {ex.status === 'completed' && (
                    <Button variant="secondary" size="sm" onClick={() => handleOpenReview(ex)}>
                      <Star size={15} />
                      <span>Calificar Experiencia</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Reception Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Validar Entrega con Código"
        maxWidth="460px"
      >
        <form onSubmit={handleConfirmSubmit} className="sv-confirm-form">
          <p className="sv-confirm-desc">
            Ingresá el código único de 8 dígitos que te facilitó tu contraparte al momento de la entrega presencial:
          </p>

          {confirmError && (
            <div className="sv-auth-alert sv-auth-alert-error">
              <AlertCircle size={16} />
              <span>{confirmError}</span>
            </div>
          )}

          {confirmSuccess && (
            <div className="sv-auth-alert sv-auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{confirmSuccess}</span>
            </div>
          )}

          <div className="sv-input-group">
            <label className="sv-input-label">CÓDIGO DE SEGURIDAD (8 CARACTERES)</label>
            <input
              type="text"
              placeholder="EJ: 9A8B7C6D"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
              className="sv-otp-input"
              autoFocus
            />
          </div>

          <div className="sv-confirm-actions">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={actionLoading}
              disabled={inputCode.trim().length < 6}
            >
              Confirmar Recepción
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leave Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Calificar Intercambio"
        maxWidth="480px"
      >
        <form onSubmit={handleReviewSubmit} className="sv-review-form">
          <p className="sv-review-desc">
            Contale a la comunidad cómo fue tu experiencia de trueque con tu contraparte:
          </p>

          {reviewError && (
            <div className="sv-auth-alert sv-auth-alert-error">
              <AlertCircle size={16} />
              <span>{reviewError}</span>
            </div>
          )}

          {reviewSuccess && (
            <div className="sv-auth-alert sv-auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{reviewSuccess}</span>
            </div>
          )}

          <div className="sv-review-rating-picker">
            <label className="sv-input-label">Calificación general</label>
            <StarRating
              rating={reviewRating}
              interactive
              size={30}
              onChange={(val) => setReviewRating(val)}
              showValue
            />
          </div>

          <div className="sv-input-group">
            <label className="sv-input-label">Comentario de la experiencia</label>
            <textarea
              rows={4}
              placeholder="¿La prenda coincidía con las fotos y el estado indicado? ¿La coordinación fue puntual y respetuosa?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="sv-input-field"
              style={{
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                height: 'auto',
                resize: 'vertical',
              }}
              required
            />
          </div>

          <div className="sv-review-actions">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Publicar Calificación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}