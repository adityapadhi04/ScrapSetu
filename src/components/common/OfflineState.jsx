import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStrings } from '../../locales/strings';

/**
 * Visual badge for offline sync status
 * Types: online, offline, syncing, synced, pending
 */
export const OfflineBadge = ({ status = 'online' }) => {
  const configs = {
    online: {
      label: '🟢 Online',
      icon: Wifi,
      className: 'badge-success',
      text: 'Connected'
    },
    offline: {
      label: '🟠 Offline',
      icon: WifiOff,
      className: 'badge-warning',
      text: 'Offline Mode'
    },
    syncing: {
      label: '🔄 Syncing',
      icon: RefreshCw,
      className: 'badge-info',
      text: 'Syncing Queue...'
    },
    synced: {
      label: '✓ Synced',
      icon: CheckCircle2,
      className: 'badge-success',
      text: 'All Synced'
    },
    pending: {
      label: '⏳ Pending Sync',
      icon: Clock,
      className: 'badge-warning',
      text: 'Pending Sync'
    }
  };

  const config = configs[status] || configs.online;
  const Icon = config.icon;

  return (
    <span
      className={`badge ${config.className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
    >
      <Icon size={12} className={status === 'syncing' ? 'spinner-icon' : ''} />
      <span>{config.label}</span>
    </span>
  );
};

/**
 * Notice banner displayed at the top of mobile dashboards when offline
 */
export const OfflineBanner = () => {
  const { isOffline, language } = useAuth();
  const t = getStrings(language);

  if (!isOffline) return null;

  return (
    <div
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.82rem',
        color: '#92400e',
        fontWeight: 600,
        textAlign: 'center'
      }}
      role="alert"
    >
      <WifiOff size={16} color="#d97706" />
      <span>{t.offlineNotice}</span>
      <span
        style={{
          background: '#fef3c7',
          padding: '2px 8px',
          borderRadius: '99px',
          fontSize: '0.72rem',
          border: '1px solid #fde68a',
          fontWeight: 700
        }}
      >
        ⏳ 2 items queued locally
      </span>
    </div>
  );
};

export default OfflineBadge;
