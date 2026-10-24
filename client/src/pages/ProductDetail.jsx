import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Repeat,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  User as UserIcon,
  Check,
  ExternalLink,
} from 'lucide-react';
import { productService } from '../services/productService.js';
import { exchangeService } from '../services/exchangeService.js';
import { useAuthStore } from '../store/authStore.js';
import { useFavoriteStore } from '../../src/store/favoriteStore.js';
import { interestTracker } from '../utils/interestTracker.js';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { StarRating } from '../components/ui/StarRating.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx';
import api from '../services/api.js';
import './ProductDetail.css';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();

  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Propose Swap Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState('');
  const [swapError, setSwapError] = useState('');

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('contenido_inapropiado');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  // AI Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        const data = await productService.getProductById(id);
        setProduct(data.product);
        if (data.product) {
          interestTracker.recordProductView(data.product);
        }
      } catch {
        setError('No pudimos cargar la prenda solicitada o ya no se encuentra disponible.');
      } finally {
        setLoading(false);
      }
    }

    async function loadAiRecs() {
      try {
        setLoadingRecs(true);
        const recData = await productService.getProductRecommendations(id);
        setRecommendations(recData.recommendations || []);
      } catch (err) {
        console.error('Error al cargar recomendaciones de IA:', err);
      } finally {
        setLoadingRecs(false);
      }
    }

    loadProduct();
    loadAiRecs();
  }, [id]);

  const images = useMemo(() => {
    if (!product?.images) return [];
    try {
      const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      return [];
    }
  }, [product]);

  const isOwner = Boolean(user && product && (user.id === product.user_id || user.id === product.user?.id));

  // Open Swap Modal & load user's available garments
  const handleOpenSwapModal = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isOwner) {
      navigate(`/perfil/${user.id}`);
      return;
    }

    setIsSwapModalOpen(true);
    setSwapError('');
    setSwapSuccess('');
    try {
      const data = await productService.getUserProducts(user.id);
      const activeItems = (data.products || []).filter((p) => p.status === 'active' && p.id !== product.id);
      setMyProducts(activeItems);
      if (activeItems.length > 0) {
        setSelectedOfferId(activeItems[0].id);
      }
    } catch (e) {
      console.error('Error fetching user products:', e);
    }
  };

  const handleConfirmSwapProposal = async () => {
    if (!selectedOfferId) return;
    setSwapLoading(true);
    setSwapError('');
    setSwapSuccess('');

    try {
      await exchangeService.requestExchange(product.id, selectedOfferId);
      setSwapSuccess('¡Solicitud de intercambio enviada exitosamente!');
      setTimeout(() => {
        setIsSwapModalOpen(false);
        navigate('/mis-intercambios');
      }, 1200);
    } catch (err) {
      setSwapError(err.response?.data?.error || 'No se pudo enviar la solicitud de intercambio.');
    } finally {
      setSwapLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isOwner) {
      navigate(`/perfil/${user.id}`);
      return;
    }

    try {
      const res = await exchangeService.requestExchange(product.id, null);
      navigate(`/chat?roomId=${res.exchange?.id}`);
    } catch {
      navigate('/chat');
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    setReportError('');
    setReportSuccess('');

    try {
      await api.post('/reports', {
        reported_user_id: product.user_id,
        reported_product_id: product.id,
        reason: reportReason,
        description: reportDesc,
      });
      setReportSuccess('Reporte enviado a moderación correctamente. Gracias por cuidar la comunidad.');
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportDesc('');
      }, 1300);
    } catch (err) {
      setReportError(err.response?.data?.error || 'Error al enviar reporte.');
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" />;
  }

  if (error || !product) {
    return (
      <div className="container sv-detail-error animate-fade-in">
        <AlertCircle size={44} className="sv-error-icon" />
        <h2>Prenda no disponible</h2>
        <p>{error || 'No encontramos los datos de esta prenda.'}</p>
        <Button variant="primary" size="md" onClick={() => navigate('/catalogo')}>
          Volver al Catálogo
        </Button>
      </div>
    );
  }

  const formatCondition = (cond) => {
    switch (cond) {
      case 'nuevo': return 'NUEVO CON ETIQUETA';
      case 'como_nuevo': return 'COMO NUEVO';
      case 'muy_bueno': return 'MUY BUENO';
      case 'bueno': return 'BUEN ESTADO';
      default: return cond ? cond.toUpperCase() : 'BUEN ESTADO';
    }
  };

  const fallbackImg = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
  const currentImg = images[selectedImageIndex] || fallbackImg;
  const favorited = isFavorite(product.id);

  return (
    <div className="container sv-product-detail-page animate-fade-in">
      {/* Back button */}
      <button type="button" className="sv-back-btn" onClick={() => navigate(-1)} aria-label="Volver atrás">
        <ArrowLeft size={16} />
        <span>Volver al catálogo</span>
      </button>

      <div className="sv-detail-grid">
        {/* Gallery Column */}
        <div className="sv-detail-gallery">
          <div className="sv-gallery-main">
            <img
              src={currentImg}
              alt={product.title}
              className="sv-gallery-main-img"
            />

            {/* Badges on main photo */}
            <span className="sv-detail-badge-condition">
              {formatCondition(product.condition)}
            </span>

            {/* Navigation arrows for images */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="sv-gallery-arrow sv-gallery-arrow-left"
                  onClick={prevImage}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  className="sv-gallery-arrow sv-gallery-arrow-right"
                  onClick={nextImage}
                  aria-label="Foto siguiente"
                >
                  <ChevronRight size={22} />
                </button>
                <div className="sv-gallery-dots">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`sv-gallery-dot ${i === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="sv-gallery-thumbs">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`sv-thumb-btn ${idx === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`Vista ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Seguridad y Garantía Segunda Vuelta */}
          <div className="sv-guarantee-card">
            <div className="sv-guarantee-header">
              <ShieldCheck size={20} className="sv-guarantee-icon" />
              <h4>POLÍTICA DE INTERCAMBIO SEGURO</h4>
            </div>
            <ul className="sv-guarantee-list">
              <li>
                <Clock size={15} />
                <span><strong>72 horas de plazo máximo</strong> para coordinar y concretar el intercambio.</span>
              </li>
              <li>
                <Repeat size={15} />
                <span><strong>Validación con código OTP único</strong> presencial entre ambas partes.</span>
              </li>
              <li>
                <Sparkles size={15} />
                <span><strong>100% libre de dinero:</strong> intercambio justo entre miembros de la comunidad.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Product Details & Actions Column */}
        <div className="sv-detail-info">
          <div className="sv-detail-header">
            <span className="sv-detail-brand">
              {product.brand ? product.brand.toUpperCase() : 'SEGUNDA VUELTA'}
            </span>
            <div className="sv-detail-views">
              <Eye size={14} />
              <span>{product.views_count || 1} visualizaciones</span>
            </div>
          </div>

          <h1 className="sv-detail-title">{product.title}</h1>

          {/* Specs grid */}
          <div className="sv-detail-specs-grid">
            <div className="sv-spec-box">
              <span className="sv-spec-label">TALLE</span>
              <span className="sv-spec-value">{product.size?.toUpperCase() || '-'}</span>
            </div>
            <div className="sv-spec-box">
              <span className="sv-spec-label">CATEGORÍA</span>
              <span className="sv-spec-value">{product.category?.toUpperCase() || '-'}</span>
            </div>
            <div className="sv-spec-box">
              <span className="sv-spec-label">GÉNERO</span>
              <span className="sv-spec-value">{product.gender?.toUpperCase() || '-'}</span>
            </div>
            <div className="sv-spec-box">
              <span className="sv-spec-label">ESTILO</span>
              <span className="sv-spec-value">{product.style?.toUpperCase() || '-'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="sv-detail-desc-block">
            <h3>Descripción de la prenda</h3>
            <p className="sv-detail-desc-text">
              {product.description || 'El dueño no agregó detalles adicionales para esta publicación.'}
            </p>
          </div>

          {/* Location Bar */}
          <div className="sv-detail-location-bar">
            <MapPin size={18} className="sv-loc-pin" />
            <div>
              <p className="sv-loc-city">
                {product.location_city || product.user?.location_city || 'Buenos Aires'}
              </p>
              <p className="sv-loc-sub">Zona sugerida para coordinar el encuentro presencial</p>
            </div>
          </div>

          {/* CTA Actions Card */}
          <div className="sv-detail-actions-card">
            {isOwner ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => navigate(`/perfil/${user.id}`)}
                className="sv-detail-swap-cta"
              >
                <UserIcon size={18} />
                <span>ESTA PRENDA ES TUYA (VER EN TU PLACARD)</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleOpenSwapModal}
                className="sv-detail-swap-cta"
              >
                <Repeat size={18} />
                <span>PROPONER INTERCAMBIO</span>
              </Button>
            )}

            {!isOwner && (
              <div className="sv-detail-secondary-actions">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleStartChat}
                >
                  <MessageSquare size={16} />
                  <span>Chatear con el dueño</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    if (!isAuthenticated) openAuthModal('login');
                    else setIsReportModalOpen(true);
                  }}
                  title="Reportar esta publicación"
                  aria-label="Reportar publicación"
                >
                  <ShieldAlert size={16} />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => toggleFavorite(product)}
              className="sv-detail-fav-btn"
              style={{
                borderColor: favorited ? 'var(--accent-primary)' : 'var(--border-medium)',
                color: favorited ? 'var(--accent-primary)' : 'var(--text-primary)',
                background: favorited ? 'var(--accent-primary-light)' : 'transparent',
                fontWeight: 700,
              }}
            >
              <Bookmark
                size={16}
                fill={favorited ? 'var(--accent-primary)' : 'none'}
                color={favorited ? 'var(--accent-primary)' : 'currentColor'}
              />
              <span>{favorited ? 'Guardada en tus Favoritos' : 'Guardar en Favoritos'}</span>
            </Button>
          </div>

          {/* Seller Profile Card */}
          <div className="sv-seller-card">
            <Avatar
              src={product.user?.avatar_url}
              alt={product.user?.display_name || 'Dueño de la prenda'}
              size="lg"
            />
            <div className="sv-seller-info">
              <Link to={`/perfil/${product.user_id}`} className="sv-seller-name">
                {product.user?.display_name || 'Usuario Segunda Vuelta'}
              </Link>
              <StarRating
                rating={Number(product.user?.rating_avg) || 5.0}
                showValue
                count={product.user?.rating_count || 0}
              />
              <p className="sv-seller-bio">
                {product.user?.bio || 'Miembro verificado de la comunidad de intercambio circular.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/perfil/${product.user_id}`)}
            >
              Ver Placard
            </Button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="sv-detail-ai-section">
          <div className="sv-ai-header">
            <div className="sv-ai-title-wrap">
              <span className="sv-ai-badge">
                <Sparkles size={13} /> MOTOR IA SEGUNDA VUELTA
              </span>
              <h2>Prendas Similares para Vos</h2>
            </div>
            <p className="sv-ai-subtitle">
              Sugerencias del algoritmo de moda circular basadas en afinidad de estilo y cercanía.
            </p>
          </div>

          <div className="sv-ai-cards-grid">
            {recommendations.map((rec) => {
              const recItem = rec.product || {};
              let recImgs = [];
              try {
                recImgs = typeof recItem.images === 'string' ? JSON.parse(recItem.images) : (recItem.images || []);
              } catch {
                recImgs = [];
              }
              const recImg = recImgs[0] || fallbackImg;

              return (
                <div
                  key={rec.product_id}
                  className="sv-ai-card"
                  onClick={() => {
                    navigate(`/producto/${rec.product_id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sv-ai-card-img-wrap">
                    <img src={recImg} alt={rec.title} />
                    <span className="sv-ai-match-tag">
                      <Sparkles size={11} /> {rec.match_percentage}% Match
                    </span>
                  </div>
                  <div className="sv-ai-card-info">
                    <span className="sv-ai-card-brand">{rec.brand ? rec.brand.toUpperCase() : 'SEGUNDA VUELTA'}</span>
                    <h4 className="sv-ai-card-title">{rec.title}</h4>
                    <p className="sv-ai-card-reason">{rec.reason}</p>
                    <div className="sv-ai-card-footer">
                      <span className="sv-ai-card-size">Talle {rec.size?.toUpperCase() || '-'}</span>
                      {rec.distance_km && (
                        <span className="sv-ai-card-dist">
                          <MapPin size={11} /> {Number(rec.distance_km).toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Propose Swap Modal */}
      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        title="Proponer Intercambio"
        maxWidth="540px"
      >
        <div className="sv-swap-modal-content">
          <p className="sv-swap-modal-desc">
            Elegí una prenda de tu placard para ofrecer a cambio de <strong>{product.title}</strong>:
          </p>

          {swapError && (
            <div className="sv-auth-alert sv-auth-alert-error">
              <AlertCircle size={16} />
              <span>{swapError}</span>
            </div>
          )}

          {swapSuccess && (
            <div className="sv-auth-alert sv-auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{swapSuccess}</span>
            </div>
          )}

          {myProducts.length === 0 ? (
            <div className="sv-swap-modal-empty">
              <Repeat size={36} className="sv-swap-empty-icon" />
              <h4>Aún no tenés prendas activas en tu placard</h4>
              <p>Para proponer un intercambio mano a mano necesitás publicar al menos una prenda disponible.</p>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsSwapModalOpen(false);
                  navigate('/publicar');
                }}
              >
                Publicar una prenda ahora
              </Button>
            </div>
          ) : (
            <div className="sv-my-products-picker">
              {myProducts.map((p) => {
                let pImgs = [];
                try {
                  pImgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                } catch {
                  pImgs = [];
                }
                const isSelected = selectedOfferId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`sv-picker-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedOfferId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="sv-picker-img-wrap">
                      <img
                        src={pImgs?.[0] || fallbackImg}
                        alt={p.title}
                        className="sv-picker-img"
                      />
                      {isSelected && (
                        <span className="sv-picker-check">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <div className="sv-picker-details">
                      <p className="sv-picker-title">{p.title}</p>
                      <p className="sv-picker-meta">Talle: {p.size?.toUpperCase()} â€¢ {p.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="sv-swap-modal-actions">
            <Button
              variant="outline"
              onClick={() => setIsSwapModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={swapLoading}
              disabled={!selectedOfferId || myProducts.length === 0}
              onClick={handleConfirmSwapProposal}
            >
              Enviar Propuesta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Reportar Prenda"
        maxWidth="460px"
      >
        <form onSubmit={handleSendReport} className="sv-report-modal-form">
          <p className="sv-report-intro">
            Si esta prenda infringe las normas comunitarias o presenta información engañosa, indicalo a continuación:
          </p>

          {reportError && (
            <div className="sv-auth-alert sv-auth-alert-error">
              <AlertCircle size={16} />
              <span>{reportError}</span>
            </div>
          )}

          {reportSuccess && (
            <div className="sv-auth-alert sv-auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{reportSuccess}</span>
            </div>
          )}

          <div className="sv-input-group">
            <label className="sv-input-label">Motivo del reporte</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="sv-sort-select"
              style={{ width: '100%' }}
            >
              <option value="contenido_inapropiado">Contenido inapropiado / foto falsa</option>
              <option value="fraude">Intento de fraude o cobro indebido</option>
              <option value="spam">Spam / publicación repetida</option>
              <option value="acoso">Acoso o mensaje agresivo</option>
              <option value="otro">Otro motivo</option>
            </select>
          </div>

          <div className="sv-input-group">
            <label className="sv-input-label">Detalle explicativo</label>
            <textarea
              rows={4}
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Explicá detalladamente el motivo para que el equipo de moderación lo revise..."
              className="sv-input-field"
              style={{
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                height: 'auto',
                resize: 'vertical',
              }}
              required
            />
          </div>

          <div className="sv-report-actions">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger">
              Enviar Reporte
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}