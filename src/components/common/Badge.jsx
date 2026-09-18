import React from 'react';

/**
 * Reusable ScrapSetu Badge Component
 * Variants: success, warning, info, danger, neutral
 */
export const Badge = ({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
