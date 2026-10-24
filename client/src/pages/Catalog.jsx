import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterSidebar } from '../components/filters/FilterSidebar.jsx';
import { ProductGrid } from '../components/product/ProductGrid.jsx';
import { useFilterStore } from '../store/filterStore.js';
import { productService } from '../services/productService.js';
import { SlidersHorizontal, X, ArrowUpDown, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import './Catalog.css';

const FILTER_LABELS = {
  gender: 'Género',
  category: 'Tipo',
  style: 'Estilo',
  size: 'Talle',
  condition: 'Estado',
  search: 'Búsqueda',
  distance: 'Radio',
};

export function Catalog() {
  const [searchParams] = useSearchParams();
  const { filters, setFilter, resetFilters } = useFilterStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync URL search params with store on mount
  useEffect(() => {
    const q = searchParams.get('search');
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const style = searchParams.get('style');
    const sort = searchParams.get('sort');

    if (q !== null) setFilter('search', q);
    if (gender !== null) setFilter('gender', gender);
    if (category !== null) setFilter('category', category);
    if (style !== null) setFilter('style', style);
    if (sort !== null) setFilter('sort', sort);
  }, [searchParams, setFilter]);

  // Fetch products when filters or page change
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        gender: filters.gender || undefined,
        category: filters.category || undefined,
        style: filters.style || undefined,
        size: filters.size || undefined,
        condition: filters.condition || undefined,
        search: filters.search || undefined,
        sort: filters.sort || 'newest',
      };

      if (filters.userLat && filters.userLng) {
        params.lat = filters.userLat;
        params.lng = filters.userLng;
        params.radius = filters.distance;
      }

      const data = await productService.getProducts(params);
      setProducts(data.products || []);
      setTotalCount(data.pagination?.total || data.products?.length || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  // Lock body scroll on mobile filter open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  const activeFilterEntries = Object.entries(filters).filter(([key, val]) => {
    if (!val) return false;
    if (key === 'distance' && val === 50) return false;
    if (['userLat', 'userLng', 'sort', 'userCity'].includes(key)) return false;
    return true;
  });

  const formatFilterValue = (key, val) => {
    if (key === 'condition') {
      const map = {
        nuevo: 'Nuevo',
        como_nuevo: 'Como nuevo',
        muy_bueno: 'Muy bueno',
        bueno: 'Buen estado',
      };
      return map[val] || val;
    }
    return val;
  };

  return (
    <div className="container sv-catalog-page">
      {/* Header bar */}
      <div className="sv-catalog-header">
        <div className="sv-catalog-title-area">
          <h1 className="sv-catalog-title">CATÁLOGO DE PRENDAS</h1>
          <p className="sv-catalog-count">
            {loading ? 'Buscando indumentaria...' : `${totalCount} prendas disponibles para trueque`}
          </p>
        </div>

        <div className="sv-catalog-actions">
          <button
            type="button"
            className="sv-mobile-filter-btn"
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal size={16} />
            <span>Filtros {activeFilterEntries.length > 0 ? `(${activeFilterEntries.length})` : ''}</span>
          </button>

          <div className="sv-sort-wrapper">
            <ArrowUpDown size={14} className="sv-sort-icon" />
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="sv-sort-select"
              aria-label="Ordenar prendas"
            >
              <option value="newest">Más recientes</option>
              <option value="views">Más vistas</option>
              <option value="cercania">Mayor cercanía</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterEntries.length > 0 && (
        <div className="sv-active-chips-bar animate-fade-in">
          <span className="sv-chips-label">Filtros activos:</span>
          <div className="sv-chips-list">
            {activeFilterEntries.map(([key, val]) => (
              <span key={key} className="sv-filter-chip">
                <span>{FILTER_LABELS[key] || key}: {formatFilterValue(key, val)}</span>
                <button
                  type="button"
                  onClick={() => setFilter(key, key === 'distance' ? 50 : '')}
                  aria-label={`Eliminar filtro ${key}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              className="sv-chips-clear-all"
              onClick={() => resetFilters()}
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* Catalog Layout */}
      <div className="sv-catalog-layout">
        {/* Desktop Sidebar */}
        <aside className="sv-catalog-sidebar-col">
          <FilterSidebar onFilterChange={() => setPage(1)} />
        </aside>

        {/* Mobile Filter Drawer Overlay */}
        {isMobileFilterOpen && (
          <div className="sv-mobile-filter-overlay" onClick={() => setIsMobileFilterOpen(false)}>
            <div className="sv-mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sv-mobile-filter-header">
                <h3>FILTRAR PRENDAS</h3>
                <button
                  type="button"
                  className="sv-mobile-filter-close"
                  onClick={() => setIsMobileFilterOpen(false)}
                  aria-label="Cerrar filtros"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="sv-mobile-filter-body">
                <FilterSidebar onFilterChange={() => setPage(1)} />
              </div>

              <div className="sv-mobile-filter-footer">
                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Ver {totalCount} prendas
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid and Pagination */}
        <main className="sv-catalog-content-col">
          <ProductGrid
            products={products}
            loading={loading}
            emptyTitle="No encontramos prendas con estos filtros"
            emptyMessage="Probá cambiando la categoría, el talle o ampliando el radio de kilómetros."
            onResetFilters={() => resetFilters()}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="sv-pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Anterior
              </Button>
              <span className="sv-pagination-info">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}