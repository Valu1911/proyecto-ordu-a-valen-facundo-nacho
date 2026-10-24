import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bookmark, ArrowLeft, Trash2, Repeat, Sparkles } from 'lucide-react';
import { useFavoriteStore } from '../store/favoriteStore.js';
import { Button } from '../components/ui/Button.jsx';
import './Favorites.css';

export function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, clearFavorites } = useFavoriteStore();

  return (
    <div className="container sv-favorites-page">
      {/* Header */}
      <div className="sv-favorites-header">
        <button type="button" className="sv-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        <div className="sv-favorites-title-row">
          <div>
            <div className="sv-fav-badge">
              <Bookmark size={14} />
              <span>TU LISTA DE DESEOS</span>
            </div>
            <h1 className="sv-favorites-title">Prendas Guardadas para Intercambio</h1>
            <p className="sv-favorites-subtitle">
              Guardá prendas que te interesan para coordinar swaps cuando tengas disponibilidad.
            </p>
          </div>

          {favorites.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearFavorites}>
              <Trash2 size={14} />
              <span>Vaciar Lista</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid or Empty state */}
      {favorites.length === 0 ? (
        <div className="sv-favorites-empty">
          <div className="sv-fav-empty-icon">
            <Bookmark size={40} />
          </div>
          <h3>Todavía no guardaste ninguna prenda</h3>
          <p>
            Explorá el catálogo de indumentaria, camisetas y calzado, y hacé clic en el ícono de guardar para armar tu lista de swaps favoritos.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/catalogo')}>
            <span>EXPLORAR CATÁLOGO</span>
          </Button>
        </div>
      ) : (
        <div className="sv-favorites-grid">
          {favorites.map((product) => {
            let images = [];
            try {
              images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []);
            } catch {
              images = [];
            }
            const img = images[0] || 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=600&q=80';

            return (
              <div key={product.id} className="sv-fav-card">
                <div className="sv-fav-card-img-wrap" onClick={() => navigate(`/prenda/${product.id}`)}>
                  <img src={img} alt={product.title} />
                  <span className="sv-fav-card-condition">
                    {product.item_condition?.toUpperCase() || 'BUENO'}
                  </span>
                </div>

                <div className="sv-fav-card-body">
                  <span className="sv-fav-card-brand">{product.brand?.toUpperCase() || 'SEGUNDA VUELTA'}</span>
                  <Link to={`/prenda/${product.id}`} className="sv-fav-card-title">
                    {product.title}
                  </Link>

                  <div className="sv-fav-card-meta">
                    <span>Talle: <strong>{product.size?.toUpperCase() || '-'}</strong></span>
                    <span>•</span>
                    <span>{product.category?.toUpperCase() || '-'}</span>
                    <span>•</span>
                    <span>{product.location_city || 'Buenos Aires'}</span>
                  </div>

                  <div className="sv-fav-card-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/prenda/${product.id}`)}
                    >
                      <Repeat size={14} />
                      <span>Ver y Proponer Swap</span>
                    </Button>
                    <button
                      type="button"
                      className="sv-fav-remove-btn"
                      onClick={() => removeFavorite(product.id)}
                      title="Quitar de guardados"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
