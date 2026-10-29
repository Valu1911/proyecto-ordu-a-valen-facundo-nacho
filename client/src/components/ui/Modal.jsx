import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  className = '',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portal to <body>: any ancestor with transform/filter/backdrop-filter would
  // otherwise become the containing block of this position:fixed overlay.
  return createPortal(
    <div className="sv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`sv-modal-card ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sv-modal-header">
          {title && <h3 className="sv-modal-title">{title}</h3>}
          <button
            type="button"
            className="sv-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="sv-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
