/**
 * ScrapSetu — SyncStatusIndicator (Module 10)
 *
 * Compact header indicator showing real-time sync state.
 *
 * States:
 *   🟢 Online
 *   🔴 Offline
 *   🔄 Syncing
 *   🟡 N Pending
 *   ✓ Synced
 *   ⚠ Sync Error
 *
 * Uses icons + text (not only colour) for accessibility.
 */
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getQueueStats } from '../../services/syncQueueService';
import { getSyncingStatus } from '../../services/syncEngine';

const POLL_INTERVAL_MS = 3000;

const SyncStatusIndicator = ({ onClick }) => {
  const { isOffline } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ pending: 0, syncing: 0, synced: 0, failed: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll queue stats periodically
  useEffect(() => {
    const update = () => {
      try {
        setStats(getQueueStats());
        setIsSyncing(getSyncingStatus());
      } catch {
        // Safe to ignore — services may not be ready yet
      }
    };
    update();
    const interval = setInterval(update, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Determine display state
  let state, label, Icon, bgColor, textColor, borderColor;

  if (isOffline) {
    state = 'offline';
    label = `🔴 ${t('offline', 'Offline')}`;
    Icon = WifiOff;
    bgColor = '#fffbeb';
    textColor = '#b45309';
    borderColor = '#fde68a';
  } else if (isSyncing) {
    state = 'syncing';
    label = `🔄 ${t('syncing', 'Syncing...')}`;
    Icon = RefreshCw;
    bgColor = '#eff6ff';
    textColor = '#1d4ed8';
    borderColor = '#bfdbfe';
  } else if (stats.failed > 0) {
    state = 'error';
    label = `⚠ ${t('syncAttentionNeeded', 'Sync needs attention')}`;
    Icon = AlertTriangle;
    bgColor = '#fef2f2';
    textColor = '#dc2626';
    borderColor = '#fecaca';
  } else if (stats.pending > 0) {
    state = 'pending';
    label = `🟡 ${stats.pending} ${t('pending', 'Pending')}`;
    Icon = null;
    bgColor = '#fffbeb';
    textColor = '#92400e';
    borderColor = '#fde68a';
  } else if (stats.synced > 0 && stats.pending === 0) {
    state = 'synced';
    label = `✓ ${t('synced', 'Synced')}`;
    Icon = CheckCircle2;
    bgColor = '#f0fdf4';
    textColor = '#15803d';
    borderColor = '#dcfce7';
  } else {
    state = 'online';
    label = `🟢 ${t('online', 'Online')}`;
    Icon = Wifi;
    bgColor = '#f0fdf4';
    textColor = '#15803d';
    borderColor = '#dcfce7';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '99px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        color: textColor,
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap'
      }}
      title={`${t('syncStatus', 'Sync Status')}: ${label} — ${t('syncQueue', 'Sync Queue')}`}
      aria-label={`System status: ${label}. Click to view sync status.`}
    >
      {Icon && (
        <Icon
          size={12}
          style={state === 'syncing' ? { animation: 'spin 1s linear infinite' } : undefined}
        />
      )}
      <span>{label}</span>
    </button>
  );
};

export default SyncStatusIndicator;
