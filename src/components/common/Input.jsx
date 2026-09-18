import React from 'react';

/**
 * Reusable Form Input Component
 */
export const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled = false,
  className = '',
  required = false,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="form-input"
        {...props}
      />
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</span>}
      {helperText && !error && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{helperText}</span>}
    </div>
  );
};

export default Input;
