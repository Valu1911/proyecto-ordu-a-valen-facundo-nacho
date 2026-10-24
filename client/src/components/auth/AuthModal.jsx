import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { authService } from '../../services/authService.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import './AuthModal.css';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, setUser, setToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [locationCity, setLocationCity] = useState('Buenos Aires');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAcceptTerms(false);
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authModalMode === 'register') {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres por seguridad.');
        return;
      }
      if (!acceptTerms) {
        setError('Debés aceptar los Términos y Condiciones y el compromiso de 72hs para crear tu cuenta.');
        return;
      }
    }

    setLoading(true);

    try {
      if (authModalMode === 'login') {
        const data = await authService.login(email.trim(), password);
        const token = data.accessToken || data.token;
        setUser(data.user);
        setToken(token);
        setSuccess('¡Inicio de sesión exitoso! Bienvenido de nuevo.');
        setTimeout(() => handleClose(), 700);
      } else {
        const data = await authService.register({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          location_city: locationCity.trim(),
          location_province: 'Buenos Aires',
        });
        const token = data.accessToken || data.token;
        setUser(data.user);
        setToken(token);
        setSuccess('¡Cuenta creada exitosamente! Bienvenido a Segunda Vuelta.');
        setTimeout(() => handleClose(), 700);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Ocurrió un error al procesar la solicitud.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google Simulation Button
  const handleGoogleSimulatedLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const googleDemoEmail = 'demo.google@segundavuelta.com';
      try {
        const data = await authService.login(googleDemoEmail, 'GoogleDemo2026!');
        const token = data.accessToken || data.token;
        setUser(data.user);
        setToken(token);
        setSuccess('Conectado con cuenta Google');
        setTimeout(() => handleClose(), 700);
      } catch {
        const data = await authService.register({
          email: googleDemoEmail,
          password: 'GoogleDemo2026!',
          display_name: 'Usuario Google Demo',
          location_city: 'CABA',
          location_province: 'Buenos Aires',
        });
        const token = data.accessToken || data.token;
        setUser(data.user);
        setToken(token);
        setSuccess('Conectado con cuenta Google');
        setTimeout(() => handleClose(), 700);
      }
    } catch {
      setError('No se pudo simular la conexión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isAuthModalOpen}
        onClose={handleClose}
        title={authModalMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        maxWidth="460px"
      >
        <div className="sv-auth-container">
          {/* Top Mode Tabs */}
          <div className="sv-auth-mode-tabs">
            <button
              type="button"
              className={`sv-auth-tab ${authModalMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setAuthModalMode('login');
              }}
            >
              INGRESAR
            </button>
            <button
              type="button"
              className={`sv-auth-tab ${authModalMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setAuthModalMode('register');
              }}
            >
              REGISTRARSE
            </button>
          </div>

          <p className="sv-auth-subtitle">
            {authModalMode === 'login'
              ? 'Ingresá a tu placard para proponer intercambios, coordinar trueques y chatear.'
              : 'Sumate a la mayor red de moda circular de Argentina. Publicá tus prendas y renová tu estilo sin costo.'}
          </p>

          {error && (
            <div className="sv-auth-alert sv-auth-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="sv-auth-alert sv-auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Google OAuth Simulation Button */}
          <button
            type="button"
            className="sv-google-btn"
            onClick={handleGoogleSimulatedLogin}
            disabled={loading}
          >
            <svg className="sv-google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="sv-auth-divider">
            <span>O CON TU CORREO</span>
          </div>

          <form onSubmit={handleSubmit} className="sv-auth-form">
            {authModalMode === 'register' && (
              <>
                <Input
                  label="Nombre y Apellido"
                  placeholder="Ej: Martín Gómez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leftIcon={<User size={16} />}
                  required
                />
                <Input
                  label="Localidad / Ciudad"
                  placeholder="Ej: Palermo, CABA"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  leftIcon={<MapPin size={16} />}
                  required
                />
              </>
            )}

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <div className="sv-password-input-group">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder={authModalMode === 'register' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    className="sv-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />
            </div>

            {authModalMode === 'register' && (
              <div className="sv-terms-checkbox-wrap">
                <label className="sv-terms-label">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="sv-terms-input"
                  />
                  <span>
                    Acepto los{' '}
                    <button
                      type="button"
                      className="sv-terms-link"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Términos y Condiciones
                    </button>
                    , el compromiso de entrega de 72hs y las Normas de Comunidad.
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              className="sv-auth-submit-btn"
            >
              {authModalMode === 'login' ? 'INICIAR SESIÓN' : 'CREAR MI CUENTA'}
            </Button>
          </form>
        </div>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Términos, Condiciones y Compromiso Comunitario"
        maxWidth="560px"
      >
        <div className="sv-terms-modal-content">
          <div className="sv-terms-item">
            <h4><ShieldCheck size={18} className="sv-terms-icon" /> 1. Compromiso de Entrega en 72 Horas</h4>
            <p>
              Una vez formalizado un trueque y emitido el código OTP único de 8 caracteres, ambas partes cuentan con un plazo estricto de 72 horas para concretar el encuentro presencial y validar las prendas.
            </p>
          </div>

          <div className="sv-terms-item">
            <h4><FileText size={18} className="sv-terms-icon" /> 2. Política de Reseñas y Reputación Transparente</h4>
            <p>
              Solo los usuarios que hayan completado un intercambio pueden calificar. Las reseñas deben ser sinceras, basadas en el estado real de la prenda recibida y la puntualidad del encuentro.
            </p>
          </div>

          <div className="sv-terms-item">
            <h4><ShieldCheck size={18} className="sv-terms-icon" /> 3. Tolerancia Cero a la Intermediación Monetaria</h4>
            <p>
              Segunda Vuelta es una plataforma 100% de trueque circular directo. Queda terminantemente prohibido exigir pagos en dinero o transferencias paralelas.
            </p>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="md"
            onClick={() => {
              setAcceptTerms(true);
              setShowTermsModal(false);
            }}
          >
            Entendido y Acepto las Condiciones
          </Button>
        </div>
      </Modal>
    </>
  );
}