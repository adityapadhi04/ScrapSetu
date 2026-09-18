import React from 'react';

/**
 * Standard Page Layout Container
 */
export const PageContainer = ({
  children,
  mobile = false,
  maxWidth = '1240px',
  className = '',
  ...props
}) => {
  const containerClass = mobile ? 'page-container-mobile' : 'page-container';

  return (
    <main
      className={`${containerClass} ${className}`.trim()}
      style={!mobile ? { maxWidth } : undefined}
      {...props}
    >
      {children}
    </main>
  );
};

export default PageContainer;
