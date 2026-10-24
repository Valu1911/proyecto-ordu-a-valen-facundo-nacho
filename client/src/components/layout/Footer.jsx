import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, MapPin, Heart, Sparkles } from 'lucide-react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="sv-footer">
      {/* Main Footer Links */}
      <div className="container sv-footer-main">
        <div className="sv-footer-brand-col">
          <Link to="/" className="sv-footer-brand-logo">
            <span className="sv-footer-brand-title">SEGUNDA VUELTA</span>
            <span className="sv-footer-brand-subtitle">MODA CIRCULAR</span>
          </Link>
          <p className="sv-footer-desc">
            Plataforma argentina de intercambio justo de indumentaria y calzado.
            Reduciendo el desperdicio textil a través del trueque de cercanía y la confianza comunitaria.
          </p>
          <div className="sv-footer-badges-row">
            <span className="sv-footer-pill"><RefreshCw size={13} /> 100% Circular</span>
            <span className="sv-footer-pill"><ShieldCheck size={13} /> Swap 72hs</span>
            <span className="sv-footer-pill"><MapPin size={13} /> CABA & GBA</span>
          </div>
        </div>

        <div className="sv-footer-col">
          <h5>EXPLORAR CATÁLOGO</h5>
          <ul>
            <li><Link to="/catalogo?gender=hombre">Prendas de Hombre</Link></li>
            <li><Link to="/catalogo?gender=mujer">Prendas de Mujer</Link></li>
            <li><Link to="/catalogo?gender=unisex">Unisex & Oversized</Link></li>
            <li><Link to="/catalogo?style=deportivo">Camisetas de Fútbol</Link></li>
            <li><Link to="/catalogo?style=streetwear">Streetwear & Skate</Link></li>
          </ul>
        </div>

        <div className="sv-footer-col">
          <h5>COMUNIDAD & SWAPS</h5>
          <ul>
            <li><Link to="/publicar">Publicar una Prenda</Link></li>
            <li><Link to="/mis-intercambios">Mis Intercambios Activos</Link></li>
            <li><Link to="/chat">Bandeja de Mensajes</Link></li>
            <li><Link to="/favoritos">Prendas Guardadas</Link></li>
          </ul>
        </div>

        <div className="sv-footer-col">
          <h5>SEGURIDAD Y COMPROMISO</h5>
          <ul>
            <li><span>Validación con Código de 8 Dígitos</span></li>
            <li><span>Plazo límite de 72hs por Swap</span></li>
            <li><span>Sistema de Reputación Transparente</span></li>
            <li><span>Comunidad libre de intermediación</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="sv-footer-bottom">
        <div className="container sv-footer-bottom-container">
          <p>© 2026 Segunda Vuelta. Todos los derechos reservados. Economía Circular Textil.</p>
          <p className="sv-footer-status">
            <Sparkles size={12} className="sv-status-dot" />
            <span>Plataforma Operativa v1.0</span>
          </p>
        </div>
      </div>
    </footer>
  );
}