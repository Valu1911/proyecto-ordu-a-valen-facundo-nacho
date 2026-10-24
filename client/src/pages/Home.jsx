import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  Repeat,
  Clock,
  ChevronRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { productService } from '../services/productService.js';
import { ProductGrid } from '../components/product/ProductGrid.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useFilterStore } from '../store/filterStore.js';
import './Home.css';

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const { setFilter } = useFilterStore();

  const [recentProducts, setRecentProducts] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeProducts() {
      try {
        setLoading(true);
        const data = await productService.getProducts({ limit: 8, sort: 'newest' });
        setRecentProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching home products:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchAiRecs() {
      try {
        const data = await productService.getPersonalizedRecommendations({ limit: 4 });
        setAiRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching AI recommendations for home:', err);
      }
    }

    fetchHomeProducts();
    fetchAiRecs();
  }, []);

  const handleCategoryClick = (category, style = '') => {
    if (category) setFilter('category', category);
    if (style) setFilter('style', style);
    navigate('/catalogo');
  };

  return (
    <div className="sv-home-page">
      {/* Hero Section */}
      <section className="sv-hero-section">
        <div className="container sv-hero-container">
          <div className="sv-hero-content animate-fade-in">
            <div className="sv-hero-badge-row">
              <span className="sv-hero-tag">
                <Sparkles size={14} />
                <span>MODA CIRCULAR EN ARGENTINA</span>
              </span>
              <span className="sv-hero-stats-pill">
                <Zap size={13} />
                <span>CERO INTERMEDIACIÓN</span>
              </span>
            </div>

            <h1 className="sv-hero-title">
              RENOVÁ TU PLACARD SIN GASTAR UN SOLO PESO.
            </h1>

            <p className="sv-hero-desc">
              Publicá la ropa que ya no usás y descubrí prendas auténticas, camisetas de fútbol,
              streetwear y camperas para intercambiar con gente de tu zona con total seguridad.
            </p>

            <div className="sv-hero-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/catalogo')}
                className="sv-hero-btn-primary"
              >
                <span>EXPLORAR CATÁLOGO</span>
                <ArrowRight size={18} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (!isAuthenticated) openAuthModal('login');
                  else navigate('/publicar');
                }}
                className="sv-hero-btn-secondary"
              >
                <span>PUBLICAR PRENDA</span>
              </Button>
            </div>

            <div className="sv-hero-trust-metrics">
              <div className="sv-trust-item">
                <span className="sv-trust-number">72hs</span>
                <span className="sv-trust-label">Plazo de swap</span>
              </div>
              <div className="sv-trust-divider" />
              <div className="sv-trust-item">
                <span className="sv-trust-number">100%</span>
                <span className="sv-trust-label">Trueque directo</span>
              </div>
              <div className="sv-trust-divider" />
              <div className="sv-trust-item">
                <span className="sv-trust-number">OTP</span>
                <span className="sv-trust-label">Código de entrega</span>
              </div>
            </div>
          </div>

          <div className="sv-hero-banner-card">
            <div className="sv-hero-card-img-wrapper">
              <img
                src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1000&q=80"
                alt="Moda Urbana y Circular"
                className="sv-hero-card-img"
              />
              <div className="sv-hero-card-overlay">
                <span className="sv-hero-card-badge">COLECCIÓN CIRCULAR 2026</span>
                <h3>CAMISETAS, BUZOS & STREETWEAR</h3>
                <p>Prendas listas para proponer e intercambiar mano a mano</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Destacadas */}
      <section className="sv-quick-categories container">
        <div className="sv-section-header">
          <div>
            <h2 className="sv-section-title">CATEGORÍAS MÁS POPULARES</h2>
            <p className="sv-section-subtitle">Explorá por los estilos con mayor movimiento de la comunidad</p>
          </div>
          <Link to="/catalogo" className="sv-view-all-link">
            <span>Ver todo el catálogo</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="sv-cat-grid">
          <div
            className="sv-cat-card"
            onClick={() => handleCategoryClick('camisetas', 'deportivo')}
            role="button"
            tabIndex={0}
          >
            <img
              src="https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=600&q=80"
              alt="Camisetas de Fútbol"
              className="sv-cat-card-bg"
            />
            <div className="sv-cat-card-content">
              <span className="sv-cat-card-badge">DEPORTIVO</span>
              <h3>CAMISETAS DE FÚTBOL</h3>
              <p>Clubes argentinos, selecciones y retro</p>
            </div>
          </div>

          <div
            className="sv-cat-card"
            onClick={() => handleCategoryClick('buzos', 'streetwear')}
            role="button"
            tabIndex={0}
          >
            <img
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80"
              alt="Buzos y Hoodies"
              className="sv-cat-card-bg"
            />
            <div className="sv-cat-card-content">
              <span className="sv-cat-card-badge">STREETWEAR</span>
              <h3>BUZOS & HOODIES</h3>
              <p>Oversized, estampados y vintage</p>
            </div>
          </div>

          <div
            className="sv-cat-card"
            onClick={() => handleCategoryClick('camperas', '')}
            role="button"
            tabIndex={0}
          >
            <img
              src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80"
              alt="Camperas y Abrigos"
              className="sv-cat-card-bg"
            />
            <div className="sv-cat-card-content">
              <span className="sv-cat-card-badge">ABRIGOS</span>
              <h3>CAMPERAS & BOMBERS</h3>
              <p>Rompevientos, puffer y denim</p>
            </div>
          </div>

          <div
            className="sv-cat-card"
            onClick={() => handleCategoryClick('calzado', '')}
            role="button"
            tabIndex={0}
          >
            <img
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80"
              alt="Zapatillas Urbanas"
              className="sv-cat-card-bg"
            />
            <div className="sv-cat-card-content">
              <span className="sv-cat-card-badge">CALZADO</span>
              <h3>ZAPATILLAS URBANAS</h3>
              <p>Modelos clásicos, básquet y running</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recién Publicadas */}
      <section className="container sv-feed-section">
        <div className="sv-section-header">
          <div>
            <h2 className="sv-section-title">RECIÉN PUBLICADAS</h2>
            <p className="sv-section-subtitle">Las últimas prendas añadidas a la plataforma listas para intercambiar</p>
          </div>
          <Link to="/catalogo?sort=newest" className="sv-view-all-link">
            <span>Ver catálogo completo</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <ProductGrid
          products={recentProducts}
          loading={loading}
          emptyTitle="El catálogo se está poblando"
          emptyMessage="Sé el primero en publicar una prenda para dar inicio al intercambio circular."
        />
      </section>

      {/* Recomendados por IA */}
      {aiRecommendations.length > 0 && (
        <section className="container sv-ai-home-section">
          <div className="sv-ai-home-banner">
            <div className="sv-ai-home-header">
              <div className="sv-ai-home-tag">
                <Sparkles size={13} />
                <span>MOTOR IA SEGUNDA VUELTA</span>
              </div>
              <h2>DESCUBRÍ CON INTELIGENCIA ARTIFICIAL</h2>
              <p>Prendas seleccionadas por afinidad de estilo urbano y cercanía geográfica para swaps directos.</p>
            </div>
          </div>

          <div className="sv-ai-cards-grid">
            {aiRecommendations.map((rec) => {
              const item = rec.product || {};
              let imgs = [];
              try {
                imgs = typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || []);
              } catch {
                imgs = [];
              }
              const img = imgs[0] || 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=600&q=80';

              return (
                <div
                  key={rec.product_id}
                  className="sv-ai-card"
                  onClick={() => navigate(`/producto/${rec.product_id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sv-ai-card-img-wrap">
                    <img src={img} alt={rec.title} />
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

      {/* Cómo Funciona el Sistema de Intercambio (3 Pasos Claros) */}
      <section className="sv-how-it-works-section">
        <div className="container">
          <div className="sv-how-header">
            <span className="sv-how-tag">METODOLOGÍA SEGURA</span>
            <h2>¿CÓMO FUNCIONA SEGUNDA VUELTA?</h2>
            <p>Intercambio directo y transparente respaldado por validación de 72 horas</p>
          </div>

          <div className="sv-steps-grid">
            <div className="sv-step-card">
              <div className="sv-step-number">01</div>
              <div className="sv-step-icon">
                <Repeat size={26} />
              </div>
              <h3>PUBLICÁ Y DESCUBRÍ</h3>
              <p>Subí hasta 6 fotos de tus prendas indicando talle, estilo y estado. Explorá el catálogo y filtrá por cercanía geográfica.</p>
            </div>

            <div className="sv-step-card">
              <div className="sv-step-number">02</div>
              <div className="sv-step-icon">
                <Clock size={26} />
              </div>
              <h3>PROPONÉ Y FORMALIZÁ</h3>
              <p>Chateá en tiempo real con el dueño de la prenda. Al acordar, se formaliza el swap con un plazo límite estricto de 72 horas.</p>
            </div>

            <div className="sv-step-card">
              <div className="sv-step-number">03</div>
              <div className="sv-step-icon">
                <ShieldCheck size={26} />
              </div>
              <h3>VALIDÁ CON CÓDIGO ÚNICO</h3>
              <p>Al encontrarse, confirman con un código único de 8 caracteres. Se califica la experiencia para construir una reputación confiable.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}