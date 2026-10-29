import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Repeat, Star, Bookmark, Shirt } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useFavoriteStore } from '../../store/favoriteStore.js';
import { interestTracker } from '../../utils/interestTracker.js';
import './ProductCard.css';

export function ProductCard({ product, onQuickSwap = null }) {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const favorited = isFavorite(product.id);

  // Image parsing (can be array or JSON string)
  let images = [];
  try {
    images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
  } catch {
    images = [];
  }
  const fallbackImg = 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=600&q=80';
  const mainImage = (!imageError && images[0]) ? images[0] : fallbackImg;

  const formatCondition = (cond) => {
    switch (cond) {
      case 'nuevo': return 'NUEVO';
      case 'como_nuevo': return 'COMO NUEVO';
      case 'muy_bueno': return 'MUY BUENO';
      case 'bueno': return 'BUEN ESTADO';
      default: return cond ? cond.toUpperCase() : 'BUEN ESTADO';
    }
  };

  const handleSwapClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
    } else if (onQuickSwap) {
      onQuickSwap(product);
    } else {
      navigate(`/prenda/${product.id}?action=swap`);
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleCardClick = () => {
    interestTracker.recordProductView(product);
  };

  return (
    <div className="sv-product-card">
      <Link to={`/prenda/${product.id}`} className="sv-product-link" onClick={handleCardClick}>
        {/* Media Container */}
        <div className="sv-product-media">
          <img
            src={mainImage}
            alt={product.title || 'Prenda Segunda Vuelta'}
            className="sv-product-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />

          {/* Bookmark Button (44x44px touch target) */}
          <button
            type="button"
            className={`sv-product-fav-btn ${favorited ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            title={favorited ? 'Quitar de guardados' : 'Guardar prenda'}
            aria-label={favorited ? 'Quitar de guardados' : 'Guardar prenda'}
          >
            <Bookmark size={17} fill={favorited ? 'currentColor' : 'none'} />
          </button>

          {/* Badges Overlay */}
          <div className="sv-product-badges">
            <span className="sv-badge-condition">
              {formatCondition(product.condition)}
            </span>
            {product.size && (
              <span className="sv-badge-size">
                TALLE {product.size.toUpperCase()}
              </span>
            )}
          </div>

          {/* Desktop Hover Quick Action */}
          <div className="sv-product-hover-action">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleSwapClick}
              className="sv-quick-swap-btn"
            >
              <Repeat size={14} />
              <span>PROPONER INTERCAMBIO</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="sv-product-info">
          <div className="sv-product-header">
            <span className="sv-product-brand">
              {product.brand ? product.brand.toUpperCase() : 'SEGUNDA VUELTA'}
            </span>
            {product.user?.rating_avg > 0 && (
              <div className="sv-product-rating">
                <Star size={12} className="sv-star-icon" fill="currentColor" />
                <span>{Number(product.user.rating_avg).toFixed(1)}</span>
              </div>
            )}
          </div>

          <h4 className="sv-product-title" title={product.title}>
            {product.title}
          </h4>

          <div className="sv-product-details">
            {product.category && <span className="sv-product-tag">{product.category}</span>}
            {product.category && product.style && <span className="sv-product-dot">•</span>}
            {product.style && <span className="sv-product-tag">{product.style}</span>}
          </div>

          <div className="sv-product-footer">
            <div className="sv-product-location">
              <MapPin size={13} />
              <span>
                {product.location_city || product.user?.location_city || 'Buenos Aires'}
                {product.distance_km ? ` • a ${Number(product.distance_km).toFixed(1)} km` : ''}
              </span>
            </div>

            {/* Mobile-visible Swap Button */}
            <button
              type="button"
              className="sv-mobile-quick-swap-btn"
              onClick={handleSwapClick}
              title="Proponer Intercambio"
              aria-label="Proponer Intercambio"
            >
              <Repeat size={14} />
              <span>Swap</span>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}