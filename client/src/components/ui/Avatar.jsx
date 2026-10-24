import React from 'react';
import './Avatar.css';

export function Avatar({
  src,
  alt = 'Usuario',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) {
  const [error, setError] = React.useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`sv-avatar sv-avatar-${size} ${className}`}>
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="sv-avatar-img"
        />
      ) : (
        <span className="sv-avatar-fallback">{getInitials(alt)}</span>
      )}
    </div>
  );
}
