import React from 'react';

/**
 * Reusable ScrapSetu Card Component
 * Supports interactive, collector-rounded, and custom styled cards
 */
export const Card = ({
  children,
  interactive = false,
  variant = 'default',
  onClick,
  className = '',
  ...props
}) => {
  const interactiveClass = interactive || onClick ? 'card-interactive' : '';
  const variantClass = variant !== 'default' ? `card-${variant}` : '';

  return (
    <div
      className={`card ${interactiveClass} ${variantClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
