import React from 'react';

/**
 * Reusable ScrapSetu Button Component
 * Supports variants: primary, secondary, accent, outline, ghost, danger, collector-camera
 * Supports sizes: sm, md, lg, large-touch
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  fullWidth = false,
  ...props
}) => {
  let variantClass = `btn-${variant}`;
  let sizeClass = '';
  
  if (size === 'sm') sizeClass = 'btn-sm';
  if (size === 'lg') sizeClass = 'btn-lg';
  if (size === 'large-touch') sizeClass = 'btn-large-touch';

  const widthClass = fullWidth ? 'btn-full-width' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
