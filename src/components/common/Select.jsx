import React from 'react';

/**
 * Reusable Form Select Component
 */
export const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  error,
  helperText,
  disabled = false,
  className = '',
  required = false,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="form-select"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</span>}
      {helperText && !error && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{helperText}</span>}
    </div>
  );
};

export default Select;
