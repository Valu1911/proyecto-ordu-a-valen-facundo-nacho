import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`sv-btn sv-btn-${variant} sv-btn-${size} ${fullWidth ? 'sv-btn-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="sv-btn-loader" aria-hidden="true" />
      ) : null}
      <span className={loading ? 'sv-btn-text-loading' : 'sv-btn-content'}>
        {children}
      </span>
    </button>
  );
}
