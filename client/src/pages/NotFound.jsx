import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import './NotFound.css';

export function NotFound() {
  return (
    <div className="container sv-notfound-page">
      <div className="sv-notfound-card">
        <div className="sv-notfound-icon">
          <SearchX size={52} />
        </div>
        <span className="sv-notfound-code">ERROR 404 • PÁGINA NO ENCONTRADA</span>
        <h1 className="sv-notfound-title">ESTA PRENDA NO ESTÁ EN EL PLACARD</h1>
        <p className="sv-notfound-desc">
          La prenda o sección que estás buscando fue intercambiada, removida o el enlace ingresado no existe.
        </p>
        <div className="sv-notfound-actions">
          <Link to="/catalogo">
            <Button variant="primary" size="lg">
              <Compass size={16} />
              <span>EXPLORAR EL CATÁLOGO</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg">
              <ArrowLeft size={16} />
              <span>Volver al Inicio</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
