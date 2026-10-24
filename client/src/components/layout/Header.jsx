import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  MessageSquare,
  Repeat,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  SlidersHorizontal,
  Bookmark,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import { useFilterStore } from '../../store/filterStore.js';
import { useFavoriteStore } from '../../store/favoriteStore.js';
import { interestTracker } from '../../utils/interestTracker.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const { unreadCount } = useChatStore();
  const { filters, setFilter } = useFilterStore();
  const { favorites } = useFavoriteStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Sync search input if store changes externally
  useEffect(() => {
    if (filters.search !== undefined) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query) {
      interestTracker.recordSearch(query);
    }
    setFilter('search', query);
    if (location.pathname !== '/catalogo') {
      navigate(`/catalogo?search=${encodeURIComponent(query)}`);
    }
  };

  const handleCategoryNav = (gender, style = '') => {
    setFilter('gender', gender);
    if (style) {
      setFilter('style', style);
      interestTracker.recordSearch(style);
    } else {
      setFilter('style', '');
    }
    navigate('/catalogo');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sv-header">
      {/* Main Header Bar */}
      <div className="container sv-header-main">
        {/* Left: Mobile Toggle & Brand */}
        <div className="sv-header-left">
          <button
            type="button"
            className="sv-header-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="sv-brand" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="sv-brand-title">SEGUNDA VUELTA</span>
            <span className="sv-brand-subtitle">MODA CIRCULAR</span>
          </Link>
        </div>

        {/* Center: Global Search Bar (Desktop & Tablet) */}
        <form className="sv-search-form" onSubmit={handleSearchSubmit}>
          <Search size={18} className="sv-search-icon" />
          <input
            type="text"
            placeholder="Buscar remeras, buzos, camperas, zapatillas, marcas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sv-search-input"
          />
          {searchInput && (
            <button
              type="button"
              className="sv-search-clear"
              onClick={() => {
                setSearchInput('');
                setFilter('search', '');
              }}
              title="Borrar busqueda"
              aria-label="Borrar busqueda"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Right: Actions */}
        <div className="sv-header-actions">
          {/* Saved / Favorites */}
          <Link
            to="/favoritos"
            className={`sv-action-icon-btn ${location.pathname === '/favoritos' ? 'active' : ''}`}
            title="Prendas Guardadas"
            aria-label="Prendas Guardadas"
          >
            <Bookmark size={20} />
            {favorites.length > 0 && (
              <span className="sv-badge-count">{favorites.length}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              {/* My Exchanges */}
              <Link
                to="/mis-intercambios"
                className={`sv-action-icon-btn ${location.pathname === '/mis-intercambios' ? 'active' : ''}`}
                title="Mis Intercambios"
                aria-label="Mis Intercambios"
              >
                <Repeat size={20} />
              </Link>

              {/* Chat Messages */}
              <Link
                to="/chat"
                className={`sv-action-icon-btn sv-chat-icon-btn ${location.pathname === '/chat' ? 'active' : ''}`}
                title="Mensajes"
                aria-label="Mensajes"
              >
                <MessageSquare size={20} />
                {unreadCount > 0 && (
                  <span className="sv-badge-count sv-badge-count-chat">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Admin Panel (if admin) */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`sv-action-icon-btn sv-admin-badge ${location.pathname === '/admin' ? 'active' : ''}`}
                  title="Panel de Administrador"
                  aria-label="Administracion"
                >
                  <ShieldAlert size={20} />
                </Link>
              )}

              {/* Publish Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/publicar')}
                className="sv-publish-btn"
              >
                <Plus size={16} />
                <span>PUBLICAR</span>
              </Button>

              {/* User Dropdown */}
              <div className="sv-user-menu-wrapper" ref={userMenuRef}>
                <button
                  type="button"
                  className={`sv-user-menu-trigger ${isUserMenuOpen ? 'open' : ''}`}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="Menu de usuario"
                  aria-expanded={isUserMenuOpen}
                >
                  <Avatar src={user?.avatar_url} alt={user?.display_name || 'Usuario'} size="sm" />
                  <span className="sv-user-name">{user?.display_name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`sv-user-chevron ${isUserMenuOpen ? 'rotate' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="sv-user-dropdown animate-fade-in">
                    <div className="sv-user-dropdown-header">
                      <p className="sv-user-dropdown-name">{user?.display_name}</p>
                      <p className="sv-user-dropdown-email">{user?.email}</p>
                    </div>
                    <div className="sv-user-dropdown-divider" />
                    <Link
                      to={`/perfil/${user?.id}`}
                      className="sv-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon size={16} />
                      <span>Mi Placard y Perfil</span>
                    </Link>
                    <Link
                      to={`/perfil/${user?.id}?tab=settings`}
                      className="sv-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Ajustes de Cuenta</span>
                    </Link>
                    <Link
                      to="/mis-intercambios"
                      className="sv-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Repeat size={16} />
                      <span>Mis Intercambios</span>
                    </Link>
                    <Link
                      to="/favoritos"
                      className="sv-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Bookmark size={16} />
                      <span>Prendas Guardadas ({favorites.length})</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="sv-dropdown-item"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShieldAlert size={16} />
                        <span>Panel Administrador</span>
                      </Link>
                    )}
                    <div className="sv-user-dropdown-divider" />
                    <button
                      type="button"
                      className="sv-dropdown-item sv-dropdown-item-danger"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="sv-auth-buttons">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuthModal('login')}
              >
                INGRESAR
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAuthModal('register')}
              >
                REGISTRARSE
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dedicated Search Bar (< 768px) */}
      <div className="sv-header-mobile-search-bar">
        <form className="sv-search-form" onSubmit={handleSearchSubmit}>
          <Search size={16} className="sv-search-icon" />
          <input
            type="text"
            placeholder="Buscar remeras, camperas, zapatillas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sv-search-input"
          />
          {searchInput && (
            <button
              type="button"
              className="sv-search-clear"
              onClick={() => {
                setSearchInput('');
                setFilter('search', '');
              }}
              aria-label="Borrar busqueda"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Categories Bar */}
      <nav className="sv-categories-nav">
        <div className="container sv-categories-container">
          <ul className="sv-categories-list">
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.gender === '' && !filters.style ? 'active' : ''}`}
                onClick={() => handleCategoryNav('', '')}
              >
                TODO EL CATÁLOGO
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.gender === 'hombre' ? 'active' : ''}`}
                onClick={() => handleCategoryNav('hombre', '')}
              >
                HOMBRE
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.gender === 'mujer' ? 'active' : ''}`}
                onClick={() => handleCategoryNav('mujer', '')}
              >
                MUJER
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.gender === 'unisex' ? 'active' : ''}`}
                onClick={() => handleCategoryNav('unisex', '')}
              >
                UNISEX
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.style === 'deportivo' ? 'active' : ''}`}
                onClick={() => handleCategoryNav('', 'deportivo')}
              >
                CAMISETAS & DEPORTIVO
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sv-cat-link ${filters.style === 'streetwear' ? 'active' : ''}`}
                onClick={() => handleCategoryNav('', 'streetwear')}
              >
                STREETWEAR & OVERSIZED
              </button>
            </li>
            <li>
              <Link to="/catalogo?sort=cercania" className="sv-cat-link sv-cat-link-accent">
                <SlidersHorizontal size={14} />
                <span>CERCA DE MI UBICACIÓN</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="sv-mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="sv-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="sv-mobile-menu-header">
              <span className="sv-mobile-menu-title">MENÚ PRINCIPAL</span>
              <button
                type="button"
                className="sv-mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Cerrar menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="sv-mobile-nav-links">
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('', '')}>
                Todo el Catálogo
              </button>
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('hombre', '')}>
                Hombre
              </button>
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('mujer', '')}>
                Mujer
              </button>
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('unisex', '')}>
                Unisex & Oversized
              </button>
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('', 'deportivo')}>
                Camisetas y Deportivo
              </button>
              <button type="button" className="sv-mobile-link" onClick={() => handleCategoryNav('', 'streetwear')}>
                Streetwear & Skate
              </button>
              <Link
                to="/favoritos"
                className="sv-mobile-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Prendas Guardadas ({favorites.length})
              </Link>
            </div>

            <div className="sv-mobile-actions">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (!isAuthenticated) openAuthModal('login');
                  else navigate('/publicar');
                }}
              >
                <Plus size={16} />
                <span>PUBLICAR PRENDA</span>
              </Button>
              {!isAuthenticated && (
                <div className="sv-mobile-auth">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                  >
                    INGRESAR
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('register');
                    }}
                  >
                    REGISTRARSE
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}