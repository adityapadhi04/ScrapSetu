import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State Display
 */
export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-surface-subtle)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/**
 * Reusable Loading State
 */
export const LoadingState = ({ message = 'Loading ScrapSetu...' }) => {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{message}</p>
    </div>
  );
};

/**
 * Reusable Error State
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this information.',
  onRetry
}) => {
  return (
    <div className="empty-state" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: '#dc2626'
        }}
      >
        <AlertCircle size={28} />
      </div>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: '#991b1b' }}>{title}</h3>
      <p style={{ color: '#7f1d1d', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size="sm" icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
};

/**
 * Status Dot Indicator
 */
export const StatusIndicator = ({ status = 'active', label }) => {
  let dotClass = 'status-dot-active';
  if (status === 'warning' || status === 'pending') dotClass = 'status-dot-warning';
  if (status === 'inactive' || status === 'neutral') dotClass = 'status-dot-neutral';

  return (
    <span className="status-indicator">
      <span className={`status-dot ${dotClass}`} />
      {label && <span>{label}</span>}
    </span>
  );
};
