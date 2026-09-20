/**
 * ScrapSetu — Sync Status Page (Module 10)
 *
 * Accessible to all authenticated roles.
 * Route: /sync-status
 *
 * Shows:
 *   - Connection state
 *   - Queue statistics (pending / syncing / synced / failed)
 *   - Recent queue items
 *   - Sync Now / Retry Failed buttons
 *
 * PROTOTYPE NOTE:
 * This page uses LocalSyncAdapter — no real server sync occurs.
 * All sync operations are local simulations only.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Clock, ArrowLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getQueue,
  getQueueStats,
  getPendingItems,
  getFailedItems,
  SYNC_STATUSES,
} from '../../services/syncQueueService';
import {
  syncPendingChanges,
  retryFailedOperations,
  getSyncingStatus,
  getSyncSummary,
} from '../../services/syncEngine';

const REFRESH_INTERVAL_MS = 2500;

const STATUS_CONFIG = {
  [SYNC_STATUSES.PENDING]:  { label: 'Pending',  emoji: '⏳', color: '#d97706', bg: '#fffbeb' },
  [SYNC_STATUSES.SYNCING]:  { label: 'Syncing',  emoji: '🔄', color: '#1d4ed8', bg: '#eff6ff' },
  [SYNC_STATUSES.SYNCED]:   { label: 'Synced',   emoji: '✓',  color: '#15803d', bg: '#f0fdf4' },
  [SYNC_STATUSES.FAILED]:   { label: 'Failed',   emoji: '✗',  color: '#dc2626', bg: '#fef2f2' },
  [SYNC_STATUSES.CONFLICT]: { label: 'Conflict', emoji: '⚠',  color: '#7c3aed', bg: '#f5f3ff' },
};

const ENTITY_LABELS = {
  scrap_lot: '📦 Scrap Lot',
  material:  '🔩 Material',
  offer:     '💬 Offer',
  transaction: '📋 Transaction',
  handover:  '🤝 Handover',
  payment:   '💰 Payment',
};

const SyncStatusPage = () => {
  const navigate = useNavigate();
  const { isOffline, user } = useAuth();
  const { t } = useLanguage();

  const currentUserId = user?.userId || user?.id;
  const currentRole = user?.role;
  const isAdmin = currentRole === 'admin';

  const [stats, setStats] = useState({ total: 0, pending: 0, syncing: 0, synced: 0, failed: 0, conflict: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const refresh = useCallback(() => {
    try {
      setStats(getQueueStats(currentUserId, currentRole));
      const all = getQueue();
      const userItems = isAdmin ? all : all.filter((item) => item.userId === currentUserId);
      // Show the 20 most recent items for this user/admin
      setRecentItems([...userItems].reverse().slice(0, 20));
      setIsSyncing(getSyncingStatus());
    } catch {
      // Service not yet ready
    }
  }, [currentUserId, currentRole, isAdmin]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleSyncNow = async () => {
    if (isOffline) {
      setSyncResult({ type: 'info', message: t('syncNowOfflineHint', "You're offline. Sync will start when connection returns.") });
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncPendingChanges();
      setLastSyncTime(new Date().toLocaleTimeString());
      if (result.succeeded > 0) {
        setSyncResult({ type: 'success', message: `${result.succeeded} operation${result.succeeded !== 1 ? 's' : ''} synced successfully. ${result.failed > 0 ? `${result.failed} failed.` : ''}` });
      } else if (result.processed === 0) {
        setSyncResult({ type: 'info', message: 'No pending operations to sync.' });
      } else {
        setSyncResult({ type: 'error', message: `${result.failed} operation${result.failed !== 1 ? 's' : ''} failed to sync.` });
      }
    } catch (err) {
      setSyncResult({ type: 'error', message: `Sync error: ${err.message}` });
    } finally {
      setIsSyncing(false);
      refresh();
    }
  };

  const handleRetryFailed = async () => {
    const count = retryFailedOperations(true);
    if (count === 0) {
      setSyncResult({ type: 'info', message: 'No retryable failed operations found.' });
      return;
    }
    setSyncResult({ type: 'info', message: `${count} failed operation${count !== 1 ? 's' : ''} reset for retry. Starting sync...` });
    refresh();
    if (!isOffline) {
      setTimeout(() => handleSyncNow(), 500);
    }
  };

  const resultColors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  };

  const failedItems = getFailedItems().filter(
    (item) => isAdmin || item.userId === currentUserId
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {t('syncStatus', 'Sync Status')}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              {t('prototypeSyncLabel', 'Prototype Sync — Local simulation only')}
            </p>
          </div>
          {/* Connection badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 700,
            background: isOffline ? '#fffbeb' : '#f0fdf4',
            color: isOffline ? '#b45309' : '#15803d',
            border: `1px solid ${isOffline ? '#fde68a' : '#dcfce7'}`
          }}>
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isOffline ? t('offline', 'Offline') : t('online', 'Online')}
          </span>
        </div>

        {/* Sync Result Message */}
        {syncResult && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
            background: resultColors[syncResult.type].bg,
            border: `1px solid ${resultColors[syncResult.type].border}`,
            color: resultColors[syncResult.type].text,
            fontSize: '0.88rem', fontWeight: 600
          }}>
            {syncResult.message}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: t('pending', 'Pending'), value: stats.pending, color: '#d97706', bg: '#fffbeb', Icon: Clock },
            { label: t('syncing', 'Syncing'), value: stats.syncing, color: '#1d4ed8', bg: '#eff6ff', Icon: RefreshCw },
            { label: t('synced', 'Synced'), value: stats.synced, color: '#15803d', bg: '#f0fdf4', Icon: CheckCircle2 },
            { label: t('failed', 'Failed'), value: stats.failed, color: '#dc2626', bg: '#fef2f2', Icon: AlertTriangle },
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            id="sync-now-btn"
            onClick={handleSyncNow}
            disabled={isSyncing || isOffline}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
              background: (isSyncing || isOffline) ? '#e2e8f0' : '#15803d',
              color: (isSyncing || isOffline) ? '#94a3b8' : '#ffffff',
              fontWeight: 700, fontSize: '0.9rem', cursor: (isSyncing || isOffline) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={16} style={isSyncing ? { animation: 'spin 1s linear infinite' } : undefined} />
            {isSyncing ? t('syncing', 'Syncing...') : t('syncNow', 'Sync Now')}
          </button>

          {stats.failed > 0 && (
            <button
              id="retry-failed-btn"
              onClick={handleRetryFailed}
              disabled={isSyncing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0.6rem 1.25rem', borderRadius: '8px',
                border: '1px solid #fecaca',
                background: '#fef2f2', color: '#dc2626',
                fontWeight: 700, fontSize: '0.9rem', cursor: isSyncing ? 'not-allowed' : 'pointer'
              }}
            >
              <RotateCcw size={16} />
              {t('retrySync', 'Retry Failed')} ({stats.failed})
            </button>
          )}

          {lastSyncTime && (
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', gap: '4px' }}>
              <CheckCircle2 size={13} color="#22c55e" />
              {t('lastSyncTime', 'Last Sync')}: {lastSyncTime}
            </span>
          )}
        </div>

        {/* Offline hint */}
        {isOffline && (
          <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={16} color="#d97706" />
            {t('syncNowOfflineHint', "You're offline. Sync will start when connection returns.")}
          </div>
        )}

        {/* Queue Items Table */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {t('syncQueue', 'Sync Queue')}
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                ({stats.total} total)
              </span>
            </h2>
          </div>

          {recentItems.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle2 size={40} color="#dcfce7" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>Queue is empty</p>
              <p style={{ fontSize: '0.82rem' }}>No sync operations recorded yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Queue ID</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Entity Type</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Entity ID</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Operation</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Retry Count</th>
                    <th style={{ padding: '0.65rem 1rem', textAlign: 'left' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((item) => {
                    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={item.queueId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {item.queueId}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          {ENTITY_LABELS[item.entityType] || item.entityType}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', color: '#334155' }}>
                          {item.entityId}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize', color: '#475569' }}>
                          {item.operation}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                            background: sc.bg, color: sc.color
                          }}>
                            {sc.emoji} {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 1rem', color: item.retryCount > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
                          {item.retryCount}/3
                        </td>
                        <td style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Error detail for failed items */}
        {failedItems.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', margin: '0 0 0.5rem' }}>
              ⚠ {t('syncAttentionNeeded', 'Sync needs attention')}
            </h3>
            {failedItems.map((item) => (
              <div key={item.queueId} style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '4px' }}>
                <strong>{item.queueId}</strong> — {ENTITY_LABELS[item.entityType] || item.entityType} ({item.entityId}): {item.errorMessage || 'Unknown error'}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SyncStatusPage;
