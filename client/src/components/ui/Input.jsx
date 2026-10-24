import React from 'react';
import './Input.css';

export function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`sv-input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="sv-input-label">
          {label}
        </label>
      )}
      <div className={`sv-input-wrapper ${error ? 'sv-input-has-error' : ''}`}>
        {leftIcon && <span className="sv-input-icon sv-input-icon-left">{leftIcon}</span>}
        <input
          id={inputId}
          type={type}
          className={`sv-input-field ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="sv-input-icon sv-input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="sv-input-error">{error}</span>}
      {!error && helperText && <span className="sv-input-helper">{helperText}</span>}
    </div>
  );
}
