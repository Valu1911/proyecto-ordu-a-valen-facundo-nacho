import React, { useState } from 'react';
import { useFilterStore } from '../../store/filterStore.js';
import { RotateCcw, MapPin, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import './FilterSidebar.css';

const GENDERS = [
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'unisex', label: 'Unisex' },
  { id: 'ninos', label: 'Niños' },
];

const CATEGORIES = [
  { id: 'remeras', label: 'Remeras & Musculosas' },
  { id: 'buzos', label: 'Buzos & Hoodies' },
  { id: 'camperas', label: 'Camperas & Abrigos' },
  { id: 'pantalones', label: 'Pantalones & Jeans' },
  { id: 'bermudas', label: 'Bermudas & Shorts' },
  { id: 'camisetas', label: 'Camisetas de Fútbol' },
  { id: 'calzado', label: 'Zapatillas & Calzado' },
  { id: 'accesorios', label: 'Accesorios & Gorras' },
];

const STYLES = [
  { id: 'streetwear', label: 'Streetwear & Oversized' },
  { id: 'deportivo', label: 'Deportivo / Fútbol' },
  { id: 'casual', label: 'Casual Urbano' },
  { id: 'vintage', label: 'Vintage / Retro' },
  { id: 'formal', label: 'Formal / Elegante' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44'];

const CONDITIONS = [
  { id: 'nuevo', label: 'Nuevo con etiqueta' },
  { id: 'como_nuevo', label: 'Como nuevo (1-2 usos)' },
  { id: 'muy_bueno', label: 'Muy bueno (poco uso)' },
  { id: 'bueno', label: 'Buen estado general' },
];

export function FilterSidebar({ className = '', onFilterChange = null }) {
  const { filters, setFilter, setLocation, resetFilters } = useFilterStore();
  const [geoLoading, setGeoLoading] = useState(false);

  const [expanded, setExpanded] = useState({
    gender: true,
    category: true,
    style: true,
    size: true,
    condition: true,
    distance: true,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSelect = (key, value) => {
    const nextVal = filters[key] === value ? '' : value;
    setFilter(key, nextVal);
    if (onFilterChange) onFilterChange();
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude, 'Mi Ubicación');
        setGeoLoading(false);
        if (onFilterChange) onFilterChange();
      },
      () => {
        // Fallback default to Buenos Aires coords
        setLocation(-34.6037, -58.3816, 'Buenos Aires');
        setGeoLoading(false);
        if (onFilterChange) onFilterChange();
      },
      { timeout: 8000 }
    );
  };

  const handleClearLocation = (e) => {
    e.stopPropagation();
    setFilter('userLat', null);
    setFilter('userLng', null);
    setFilter('userCity', '');
    if (onFilterChange) onFilterChange();
  };

  const hasActiveFilters = Boolean(
    filters.gender ||
    filters.category ||
    filters.style ||
    filters.size ||
    filters.condition ||
    filters.search ||
    filters.userLat
  );

  return (
    <aside className={`sv-filter-sidebar ${className}`}>
      <div className="sv-filter-header">
        <h3 className="sv-filter-main-title">FILTRAR PRENDAS</h3>
        {hasActiveFilters && (
          <button
            type="button"
            className="sv-filter-reset-btn"
            onClick={() => {
              resetFilters();
              if (onFilterChange) onFilterChange();
            }}
          >
            <RotateCcw size={13} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Geolocalización & Distancia */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('distance')}
        >
          <span>DISTANCIA Y ZONA</span>
          {expanded.distance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.distance && (
          <div className="sv-filter-section-content">
            <div className="sv-location-wrapper">
              <button
                type="button"
                className={`sv-location-detect-btn ${filters.userLat ? 'has-location' : ''}`}
                onClick={handleDetectLocation}
                disabled={geoLoading}
              >
                <MapPin size={15} />
                <span>
                  {geoLoading
                    ? 'Detectando ubicación...'
                    : filters.userCity
                    ? `Ubicación: ${filters.userCity}`
                    : 'Detectar mi ubicación'}
                </span>
              </button>

              {filters.userLat && (
                <button
                  type="button"
                  className="sv-location-clear-btn"
                  onClick={handleClearLocation}
                  title="Quitar ubicación"
                  aria-label="Quitar ubicación"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sv-distance-slider-group">
              <div className="sv-slider-header">
                <span>Radio máximo:</span>
                <span className="sv-slider-val">
                  {filters.distance >= 500 ? 'Todo el país' : `${filters.distance} km`}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={filters.distance}
                onChange={(e) => {
                  setFilter('distance', Number(e.target.value));
                  if (onFilterChange) onFilterChange();
                }}
                className="sv-range-input"
              />
              <div className="sv-slider-ticks">
                <span>5 km</span>
                <span>50 km</span>
                <span>Todo el país</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Género */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('gender')}
        >
          <span>GÉNERO</span>
          {expanded.gender ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.gender && (
          <div className="sv-filter-section-content sv-options-list">
            {GENDERS.map((g) => {
              const active = filters.gender === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`sv-filter-item-btn ${active ? 'active' : ''}`}
                  onClick={() => handleSelect('gender', g.id)}
                >
                  <span className={`sv-checkbox-box ${active ? 'checked' : ''}`}>
                    {active && <Check size={12} />}
                  </span>
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Categoría */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('category')}
        >
          <span>TIPO DE PRENDA</span>
          {expanded.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.category && (
          <div className="sv-filter-section-content sv-options-list">
            {CATEGORIES.map((c) => {
              const active = filters.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`sv-filter-item-btn ${active ? 'active' : ''}`}
                  onClick={() => handleSelect('category', c.id)}
                >
                  <span className={`sv-checkbox-box ${active ? 'checked' : ''}`}>
                    {active && <Check size={12} />}
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Estilo */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('style')}
        >
          <span>ESTILO</span>
          {expanded.style ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.style && (
          <div className="sv-filter-section-content sv-options-list">
            {STYLES.map((s) => {
              const active = filters.style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`sv-filter-item-btn ${active ? 'active' : ''}`}
                  onClick={() => handleSelect('style', s.id)}
                >
                  <span className={`sv-checkbox-box ${active ? 'checked' : ''}`}>
                    {active && <Check size={12} />}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Talles */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('size')}
        >
          <span>TALLE</span>
          {expanded.size ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.size && (
          <div className="sv-filter-section-content">
            <div className="sv-sizes-grid">
              {SIZES.map((sz) => {
                const active = filters.size === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    className={`sv-size-btn ${active ? 'active' : ''}`}
                    onClick={() => handleSelect('size', sz)}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Condición */}
      <div className="sv-filter-section">
        <button
          type="button"
          className="sv-filter-section-title"
          onClick={() => toggleSection('condition')}
        >
          <span>ESTADO DE LA PRENDA</span>
          {expanded.condition ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded.condition && (
          <div className="sv-filter-section-content sv-options-list">
            {CONDITIONS.map((cond) => {
              const active = filters.condition === cond.id;
              return (
                <button
                  key={cond.id}
                  type="button"
                  className={`sv-filter-item-btn ${active ? 'active' : ''}`}
                  onClick={() => handleSelect('condition', cond.id)}
                >
                  <span className={`sv-checkbox-box ${active ? 'checked' : ''}`}>
                    {active && <Check size={12} />}
                  </span>
                  <span>{cond.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}