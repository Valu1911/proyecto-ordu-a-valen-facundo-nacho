import React from 'react';
import { ProductCard } from './ProductCard.jsx';
import { Shirt, SearchX, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import './ProductGrid.css';

export function ProductGrid({
  products = [],
  loading = false,
  emptyTitle = 'No se encontraron prendas',
  emptyMessage = 'Intenta cambiar los filtros seleccionados o ampliar el radio de búsqueda.',
  onQuickSwap = null,
  onResetFilters = null,
}) {
  if (loading) {
    return (
      <div className="sv-product-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="sv-product-skeleton">
            <div className="sv-skeleton-media" />
            <div className="sv-skeleton-body">
              <div className="sv-skeleton-line short" />
              <div className="sv-skeleton-line" />
              <div className="sv-skeleton-line medium" />
              <div className="sv-skeleton-footer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="sv-grid-empty animate-fade-in">
        <div className="sv-empty-icon">
          <SearchX size={38} />
        </div>
        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="sv-empty-reset-btn"
          >
            <RefreshCcw size={14} />
            <span>Limpiar todos los filtros</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="sv-product-grid animate-fade-in">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onQuickSwap={onQuickSwap}
        />
      ))}
    </div>
  );
}