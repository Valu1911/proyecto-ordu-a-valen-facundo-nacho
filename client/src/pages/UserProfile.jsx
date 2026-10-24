import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Star,
  Shirt,
  MessageSquare,
  Camera,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Settings,
  Shield,
  Bell,
  Sliders,
  Lock,
  Compass,
  Phone,
  Tag,
  Clock,
  Sparkles,
  Save,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { productService } from '../services/productService.js';
import { ProductGrid } from '../components/product/ProductGrid.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { StarRating } from '../components/ui/StarRating.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx';
import { interestTracker } from '../utils/interestTracker.js';
import api from '../services/api.js';
import './UserProfile.css';

export function UserProfile() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, setUser } = useAuthStore();

  const isMyProfile = currentUser?.id === id;

  const [profileUser, setProfileUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'settings' ? 'settings' : 'products'
  );
  const [loading, setLoading] = useState(true);

  // Settings: Personal Info
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [phone, setPhone] = useState('');

  // Settings: Preferences & Sizing
  const [preferredUpperSize, setPreferredUpperSize] = useState('M');
  const [preferredLowerSize, setPreferredLowerSize] = useState('32');
  const [preferredShoeSize, setPreferredShoeSize] = useState('42');
  const [preferredGender, setPreferredGender] = useState('unisex');
  const [selectedStyles, setSelectedStyles] = useState(['streetwear', 'casual']);
  const [swapRadius, setSwapRadius] = useState('15km');
  const [preferredMeetingPlace, setPreferredMeetingPlace] = useState('Puntos céntricos / Shoppings');

  // Settings: Notifications & Privacy
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [sharePhoneOnSwap, setSharePhoneOnSwap] = useState(true);

  // Settings: Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Form states
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const [userRes, prodRes, revRes] = await Promise.all([
          api.get(`/users/${id}`),
          productService.getUserProducts(id),
          api.get(`/reviews/user/${id}`),
        ]);

        const u = userRes.data.user;
        setProfileUser(u);
        setProducts(prodRes.products || []);
        setReviews(revRes.data.reviews || []);

        setEditName(u.display_name || '');
        setEditBio(u.bio || '');
        setEditCity(u.location_city || 'Buenos Aires');
        setEditProvince(u.location_province || 'CABA');

        // Load extended preferences from localStorage if exists
        try {
          const savedPrefs = localStorage.getItem(`sv_user_prefs_${u.id}`);
          if (savedPrefs) {
            const parsed = JSON.parse(savedPrefs);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.preferredUpperSize) setPreferredUpperSize(parsed.preferredUpperSize);
            if (parsed.preferredLowerSize) setPreferredLowerSize(parsed.preferredLowerSize);
            if (parsed.preferredShoeSize) setPreferredShoeSize(parsed.preferredShoeSize);
            if (parsed.preferredGender) setPreferredGender(parsed.preferredGender);
            if (parsed.selectedStyles) setSelectedStyles(parsed.selectedStyles);
            if (parsed.swapRadius) setSwapRadius(parsed.swapRadius);
            if (parsed.preferredMeetingPlace) setPreferredMeetingPlace(parsed.preferredMeetingPlace);
            if (parsed.emailAlerts !== undefined) setEmailAlerts(parsed.emailAlerts);
            if (parsed.chatSounds !== undefined) setChatSounds(parsed.chatSounds);
            if (parsed.stockAlerts !== undefined) setStockAlerts(parsed.stockAlerts);
            if (parsed.sharePhoneOnSwap !== undefined) setSharePhoneOnSwap(parsed.sharePhoneOnSwap);
          }
        } catch (e) {
          console.error('Error loading user prefs:', e);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      setSearchParams({ tab: 'settings' });
    } else {
      setSearchParams({});
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = res.data.avatar_url;
      setProfileUser((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      setUser({ ...currentUser, avatar_url: newAvatarUrl });
    } catch (err) {
      alert('Error al subir el avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const toggleStylePreference = (styleName) => {
    setSelectedStyles((prev) =>
      prev.includes(styleName) ? prev.filter((s) => s !== styleName) : [...prev, styleName]
    );
  };

  const handleSaveAllSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const res = await api.put('/users/profile', {
        display_name: editName,
        bio: editBio,
        location_city: editCity,
        location_province: editProvince,
      });

      // Save extended preferences locally
      const extendedPrefs = {
        phone,
        preferredUpperSize,
        preferredLowerSize,
        preferredShoeSize,
        preferredGender,
        selectedStyles,
        swapRadius,
        preferredMeetingPlace,
        emailAlerts,
        chatSounds,
        stockAlerts,
        sharePhoneOnSwap,
      };
      localStorage.setItem(`sv_user_prefs_${currentUser.id}`, JSON.stringify(extendedPrefs));

      // Also record styles in interestTracker so recommendations immediately reflect it
      selectedStyles.forEach((st) => interestTracker.recordSearch(st));

      setProfileUser(res.data.user);
      setUser({ ...currentUser, ...res.data.user });
      setSettingsSuccess('¡Ajustes y preferencias guardados correctamente!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      setSettingsError(err.response?.data?.error || 'Error al guardar los ajustes.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener como mínimo 8 caracteres.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmación de la contraseña no coincide.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Contraseña cambiada con éxito.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Error al cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" />;
  }

  if (!profileUser) {
    return (
      <div className="container sv-profile-error">
        <h2>Usuario no encontrado</h2>
        <Button variant="primary" onClick={() => navigate('/catalogo')}>
          Volver al Catálogo
        </Button>
      </div>
    );
  }

  const AVAILABLE_STYLES = [
    'streetwear',
    'y2k',
    'vintage',
    'deportivo',
    'baggy',
    'casual',
    'minimalista',
    'formal',
  ];

  return (
    <div className="container sv-profile-page">
      {/* Profile Header */}
      <div className="sv-profile-header-card">
        <div className="sv-profile-avatar-wrapper">
          <Avatar
            src={profileUser.avatar_url}
            alt={profileUser.display_name}
            size="xl"
            className="sv-profile-avatar-lg"
          />
          {isMyProfile && (
            <label className="sv-avatar-upload-badge" title="Cambiar foto de perfil">
              <Camera size={16} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        <div className="sv-profile-details">
          <div className="sv-profile-name-row">
            <h1 className="sv-profile-name">{profileUser.display_name}</h1>
            {profileUser.role === 'admin' && (
              <span className="badge badge-primary">ADMINISTRADOR</span>
            )}
            {profileUser.is_banned && (
              <span className="badge badge-danger">SUSPENDIDO</span>
            )}
          </div>

          <div className="sv-profile-meta-row">
            <span className="sv-profile-meta-item">
              <MapPin size={14} />
              <span>{profileUser.location_city || 'Buenos Aires, Argentina'}</span>
            </span>
            <span className="sv-profile-meta-item">
              <Calendar size={14} />
              <span>
                Miembro desde{' '}
                {new Date(profileUser.created_at).toLocaleDateString('es-AR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </span>
          </div>

          <p className="sv-profile-bio">{profileUser.bio || 'Sin biografía todavía.'}</p>

          {/* Reputation ML / Steam style */}
          <div className="sv-profile-reputation">
            <StarRating
              rating={profileUser.rating_avg || 5.0}
              showValue
              count={profileUser.rating_count || 0}
              size={18}
            />
            <span className="sv-rep-desc">
              {profileUser.rating_count > 0
                ? `${profileUser.rating_count} intercambios completados con calificación`
                : 'Nuevo miembro • Calificación impecable 5.0'}
            </span>
          </div>
        </div>

        {isMyProfile && (
          <div className="sv-profile-header-actions">
            <Button
              variant={activeTab === 'settings' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleTabChange(activeTab === 'settings' ? 'products' : 'settings')}
            >
              <Settings size={14} />
              <span>Ajustes de Cuenta</span>
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="sv-profile-tabs">
        <button
          type="button"
          className={`sv-profile-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleTabChange('products')}
        >
          <Shirt size={16} />
          <span>Prendas en su Placard ({products.length})</span>
        </button>

        <button
          type="button"
          className={`sv-profile-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => handleTabChange('reviews')}
        >
          <Star size={16} />
          <span>Reseñas de la Comunidad ({reviews.length})</span>
        </button>

        {isMyProfile && (
          <button
            type="button"
            className={`sv-profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={16} />
            <span>Ajustes Completos</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="sv-profile-tab-content">
        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <ProductGrid
            products={products}
            emptyTitle="No hay prendas disponibles"
            emptyMessage="Este usuario todavía no tiene prendas activas para intercambio."
          />
        )}

        {/* TAB 2: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="sv-reviews-list">
            {reviews.length === 0 ? (
              <div className="sv-reviews-empty">
                <Star size={36} className="sv-empty-icon" />
                <h3>Sin reseñas todavía</h3>
                <p>
                  Las opiniones de otros miembros de la comunidad aparecerán aquí al concretar
                  intercambios exitosos.
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="sv-review-card">
                  <div className="sv-review-header">
                    <Avatar
                      src={rev.reviewer?.avatar_url}
                      alt={rev.reviewer?.display_name || 'Usuario'}
                      size="sm"
                    />
                    <div>
                      <h4 className="sv-reviewer-name">{rev.reviewer?.display_name}</h4>
                      <span className="sv-review-date">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="sv-review-rating-box">
                      <StarRating rating={rev.rating} size={14} />
                    </div>
                  </div>
                  <p className="sv-review-comment">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: COMPLETE SETTINGS */}
        {activeTab === 'settings' && isMyProfile && (
          <div className="sv-settings-wrapper">
            {settingsSuccess && (
              <div className="sv-auth-alert sv-auth-alert-success sv-settings-top-alert">
                <CheckCircle2 size={18} />
                <span>{settingsSuccess}</span>
              </div>
            )}
            {settingsError && (
              <div className="sv-auth-alert sv-auth-alert-error sv-settings-top-alert">
                <AlertCircle size={18} />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAllSettings} className="sv-settings-form">
              {/* SECTION 1: Personal info */}
              <div className="sv-settings-card">
                <div className="sv-settings-card-header">
                  <Edit3 size={18} className="sv-settings-icon" />
                  <div>
                    <h3>Información Personal y Contacto</h3>
                    <p>Datos visibles para la comunidad e información de contacto para coordinar swaps.</p>
                  </div>
                </div>

                <div className="sv-settings-grid-2">
                  <Input
                    label="Nombre Completo / Apodo"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />

                  <div className="sv-input-group">
                    <label className="sv-input-label">Email Registrado (Verificado)</label>
                    <input
                      type="text"
                      className="sv-input-field"
                      value={currentUser?.email || ''}
                      disabled
                      style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                    />
                  </div>
                </div>

                <div className="sv-settings-grid-2">
                  <div className="sv-input-group">
                    <label className="sv-input-label">
                      <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                      WhatsApp de Contacto
                    </label>
                    <input
                      type="tel"
                      className="sv-input-field"
                      placeholder="Ej: +54 9 11 2345-6789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <small className="sv-input-helper">Solo se compartirá una vez que aceptes un intercambio.</small>
                  </div>

                  <div className="sv-input-group">
                    <label className="sv-input-label">Rol en la Plataforma</label>
                    <input
                      type="text"
                      className="sv-input-field"
                      value={currentUser?.role === 'admin' ? 'Administrador Oficial' : 'Miembro de la Comunidad'}
                      disabled
                      style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }}
                    />
                  </div>
                </div>

                <div className="sv-input-group">
                  <label className="sv-input-label">Biografía y Estilo Personal</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Contale a otros usuarios tus gustos de moda, marcas preferidas y qué prendas buscas..."
                    className="sv-input-field"
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2: Location & Swap Logistics */}
              <div className="sv-settings-card">
                <div className="sv-settings-card-header">
                  <MapPin size={18} className="sv-settings-icon" />
                  <div>
                    <h3>Ubicación y Logística de Swaps</h3>
                    <p>Configurá tu zona habitual para calcular distancias con otros usuarios.</p>
                  </div>
                </div>

                <div className="sv-settings-grid-2">
                  <Input
                    label="Ciudad o Barrio"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Ej: Palermo, Córdoba Capital, Rosario"
                    required
                  />

                  <Input
                    label="Provincia / Región"
                    value={editProvince}
                    onChange={(e) => setEditProvince(e.target.value)}
                    placeholder="Ej: Buenos Aires, Córdoba, Santa Fe"
                  />
                </div>

                <div className="sv-settings-grid-2">
                  <div className="sv-input-group">
                    <label className="sv-input-label">Radio Máximo de Intercambio</label>
                    <select
                      value={swapRadius}
                      onChange={(e) => setSwapRadius(e.target.value)}
                      className="sv-sort-select"
                      style={{ width: '100%', height: '44px' }}
                    >
                      <option value="5km">Mismo barrio / Hasta 5 km</option>
                      <option value="15km">Hasta 15 km (Recomendado CABA / Gran Bs As)</option>
                      <option value="30km">Hasta 30 km</option>
                      <option value="envios">Acepto envíos a todo el país</option>
                    </select>
                  </div>

                  <div className="sv-input-group">
                    <label className="sv-input-label">Puntos de Encuentro Favoritos</label>
                    <input
                      type="text"
                      className="sv-input-field"
                      placeholder="Ej: Estación de subte D, Alto Palermo, Plaza pública"
                      value={preferredMeetingPlace}
                      onChange={(e) => setPreferredMeetingPlace(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Sizing & AI Algorithm Preferences */}
              <div className="sv-settings-card">
                <div className="sv-settings-card-header">
                  <Sparkles size={18} className="sv-settings-icon" />
                  <div>
                    <h3>Preferencias de Moda y Talles (Motor de Recomendaciones IA)</h3>
                    <p>El algoritmo utilizará estos datos para priorizar publicaciones que encajen con tu perfil.</p>
                  </div>
                </div>

                <div className="sv-settings-grid-3">
                  <div className="sv-input-group">
                    <label className="sv-input-label">Talle Remera / Buzo</label>
                    <select
                      value={preferredUpperSize}
                      onChange={(e) => setPreferredUpperSize(e.target.value)}
                      className="sv-sort-select"
                      style={{ width: '100%', height: '44px' }}
                    >
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Oversize'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sv-input-group">
                    <label className="sv-input-label">Talle Pantalón / Jean</label>
                    <select
                      value={preferredLowerSize}
                      onChange={(e) => setPreferredLowerSize(e.target.value)}
                      className="sv-sort-select"
                      style={{ width: '100%', height: '44px' }}
                    >
                      {['26', '28', '30', '32', '34', '36', '38', '40', '42', '44'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sv-input-group">
                    <label className="sv-input-label">Talle Calzado (AR)</label>
                    <select
                      value={preferredShoeSize}
                      onChange={(e) => setPreferredShoeSize(e.target.value)}
                      className="sv-sort-select"
                      style={{ width: '100%', height: '44px' }}
                    >
                      {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="sv-input-group" style={{ marginTop: '1rem' }}>
                  <label className="sv-input-label">Género de Prendas que Buscas</label>
                  <div className="sv-gender-selector">
                    {[
                      { id: 'todos', label: 'Todos los géneros' },
                      { id: 'hombre', label: 'Hombre' },
                      { id: 'mujer', label: 'Mujer' },
                      { id: 'unisex', label: 'Unisex' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`sv-gender-btn ${preferredGender === g.id ? 'active' : ''}`}
                        onClick={() => setPreferredGender(g.id)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sv-input-group" style={{ marginTop: '1.25rem' }}>
                  <label className="sv-input-label">Estilos Favoritos que el Algoritmo debe Recomendarte</label>
                  <div className="sv-styles-chips">
                    {AVAILABLE_STYLES.map((st) => {
                      const isSelected = selectedStyles.includes(st);
                      return (
                        <button
                          key={st}
                          type="button"
                          className={`sv-style-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => toggleStylePreference(st)}
                        >
                          <Tag size={12} />
                          <span>{st.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: Notifications & Privacy */}
              <div className="sv-settings-card">
                <div className="sv-settings-card-header">
                  <Bell size={18} className="sv-settings-icon" />
                  <div>
                    <h3>Notificaciones y Privacidad</h3>
                    <p>Configurá cómo y cuándo querés que te avisemos de novedades.</p>
                  </div>
                </div>

                <div className="sv-toggle-list">
                  <label className="sv-toggle-item">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                    />
                    <div className="sv-toggle-text">
                      <strong>Notificaciones por Email de Nuevas Propuestas</strong>
                      <span>Recibí un aviso inmediato cuando un usuario proponga intercambiar una de tus prendas.</span>
                    </div>
                  </label>

                  <label className="sv-toggle-item">
                    <input
                      type="checkbox"
                      checked={chatSounds}
                      onChange={(e) => setChatSounds(e.target.checked)}
                    />
                    <div className="sv-toggle-text">
                      <strong>Sonidos y Alertas de Mensajes en Vivo</strong>
                      <span>Avisos sonoros en pantalla cuando recibas mensajes de chat en tiempo real.</span>
                    </div>
                  </label>

                  <label className="sv-toggle-item">
                    <input
                      type="checkbox"
                      checked={stockAlerts}
                      onChange={(e) => setStockAlerts(e.target.checked)}
                    />
                    <div className="sv-toggle-text">
                      <strong>Alertas de Nuevas Prendas en tus Talles y Estilos</strong>
                      <span>Te notificaremos cuando ingrese al catálogo una prenda perfecta para tu perfil.</span>
                    </div>
                  </label>

                  <label className="sv-toggle-item">
                    <input
                      type="checkbox"
                      checked={sharePhoneOnSwap}
                      onChange={(e) => setSharePhoneOnSwap(e.target.checked)}
                    />
                    <div className="sv-toggle-text">
                      <strong>Compartir WhatsApp Automáticamente al Aceptar Swap</strong>
                      <span>Agiliza la coordinación del punto de encuentro compartiendo tu teléfono sólo con el swap aceptado.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 5: Community Commitment */}
              <div className="sv-settings-card sv-settings-policy-card">
                <div className="sv-settings-card-header">
                  <Shield size={18} className="sv-settings-icon sv-icon-shield" />
                  <div>
                    <h3>Compromiso Comunitario Segunda Vuelta</h3>
                    <p>Políticas de convivencia, confianza y respeto mutuo en los intercambios.</p>
                  </div>
                </div>

                <div className="sv-policy-badges-grid">
                  <div className="sv-policy-badge-box">
                    <Clock size={16} />
                    <div>
                      <strong>Regla de las 72 Horas</strong>
                      <span>Compromiso de responder y concretar los swaps dentro de las 72hs hábiles.</span>
                    </div>
                  </div>

                  <div className="sv-policy-badge-box">
                    <Star size={16} />
                    <div>
                      <strong>Reseñas y Reputación Auténticas</strong>
                      <span>Sistema transparente sin comisiones monetarias donde la reputación es clave.</span>
                    </div>
                  </div>

                  <div className="sv-policy-badge-box">
                    <CheckCircle2 size={16} />
                    <div>
                      <strong>Tolerancia Cero a Fraudes</strong>
                      <span>Publicación de fotos reales y declaración honesta del estado de la prenda.</span>
                    </div>
                  </div>
                </div>

                <div className="sv-terms-status">
                  <CheckCircle2 size={16} color="var(--accent-primary)" />
                  <span>Has aceptado los Términos y Condiciones y las Políticas Comunitarias al crear tu cuenta.</span>
                </div>
              </div>

              {/* SAVE BUTTON FOR GENERAL SETTINGS */}
              <div className="sv-settings-submit-bar">
                <Button type="submit" variant="primary" size="lg" loading={settingsLoading}>
                  <Save size={16} />
                  <span>GUARDAR TODOS LOS AJUSTES</span>
                </Button>
              </div>
            </form>

            {/* SECTION 6: Change Password Form (Separated cleanly) */}
            <div className="sv-settings-card sv-password-card">
              <div className="sv-settings-card-header">
                <Lock size={18} className="sv-settings-icon" />
                <div>
                  <h3>Seguridad y Contraseña</h3>
                  <p>Cambiá tu contraseña para mantener tu cuenta protegida.</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="sv-auth-alert sv-auth-alert-success">
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="sv-auth-alert sv-auth-alert-error">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="sv-password-form">
                <div className="sv-settings-grid-3">
                  <Input
                    label="Contraseña Actual"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />

                  <Input
                    label="Nueva Contraseña (mín 8 car.)"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  <Input
                    label="Confirmar Nueva Contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="sv-password-action">
                  <Button type="submit" variant="secondary" size="md" loading={passwordLoading}>
                    <Lock size={14} />
                    <span>Actualizar Contraseña</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
