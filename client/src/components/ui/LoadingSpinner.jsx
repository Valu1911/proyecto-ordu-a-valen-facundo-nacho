import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

const DEFAULT_MESSAGES = [
  'Cargando catalogo de indumentaria...',
  'Verificando disponibilidad de prendas...',
  'Conectando con la comunidad de intercambio...',
  'Filtrando por cercania y estilo...',
];

export function LoadingSpinner({
  messages = DEFAULT_MESSAGES,
  size = 'md', // 'sm' | 'md' | 'lg'
  fullscreen = false,
}) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages]);

  const content = (
    <div className={`sv-spinner-container sv-spinner-${size}`}>
      <div className="sv-spinner-ring" />
      {messages && messages.length > 0 && (
        <p className="sv-spinner-text" key={msgIndex}>
          {messages[msgIndex]}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return <div className="sv-spinner-fullscreen">{content}</div>;
  }

  return content;
}
