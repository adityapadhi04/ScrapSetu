/**
 * ScrapSetu — Real-Time Cross-Tab & In-App Synchronization Service
 *
 * Provides instant real-time synchronization between:
 * 1. Multiple browser tabs / windows (e.g., Collector in Tab 1, Repair Shop in Tab 2)
 * 2. In-app components and role transitions
 *
 * Architecture:
 * - BroadcastChannel API for sub-millisecond cross-tab message passing
 * - Window CustomEvent for same-tab reactive state updates
 * - Window StorageEvent fallback for older browsers / isolated contexts
 * - Safe for non-browser / Node.js test execution
 */

const CHANNEL_NAME = 'scrapsetu_realtime_sync';
const EVENT_NAME = 'scrapsetu_realtime_change';

let broadcastChannel = null;

// Initialize BroadcastChannel if in browser environment
if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
  try {
    broadcastChannel = new window.BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('[realtimeSync] BroadcastChannel init failed, falling back to storage events:', e);
  }
}

/**
 * Emit a data mutation event to notify all open tabs and components in real time.
 * @param {string} type - Event category (e.g., 'LOT_CREATED', 'OFFER_CREATED', 'TRANSACTION_UPDATED')
 * @param {object} payload - Optional event details / data
 */
export const emitDataChange = (type, payload = {}) => {
  if (typeof window === 'undefined') return;

  const eventData = {
    type,
    payload,
    timestamp: Date.now()
  };

  // 1. Same-window reactive custom event
  try {
    const customEvent = new window.CustomEvent(EVENT_NAME, { detail: eventData });
    window.dispatchEvent(customEvent);
  } catch (e) {
    // Non-fatal
  }

  // 2. Cross-tab BroadcastChannel message
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (e) {
      // Non-fatal
    }
  }
};

/**
 * Subscribe to real-time data changes across tabs and within the current session.
 * @param {function} onSync - Callback invoked whenever new data is detected
 * @returns {function} Cleanup / unsubscribe function
 */
export const subscribeToRealtimeSync = (onSync) => {
  if (typeof window === 'undefined' || typeof onSync !== 'function') {
    return () => {};
  }

  // Handle same-window events
  const handleCustomEvent = (event) => {
    try {
      onSync(event.detail || { type: 'CUSTOM_EVENT' });
    } catch (err) {
      console.warn('[realtimeSync] Error in custom event handler:', err);
    }
  };

  // Handle cross-tab BroadcastChannel events
  const handleBroadcastMessage = (event) => {
    try {
      onSync(event.data || { type: 'BROADCAST_MESSAGE' });
    } catch (err) {
      console.warn('[realtimeSync] Error in broadcast message handler:', err);
    }
  };

  // Handle cross-tab localStorage changes
  const handleStorageEvent = (event) => {
    if (event.key && event.key.startsWith('scrapsetu_')) {
      try {
        onSync({ type: 'STORAGE_KEY_CHANGED', key: event.key });
      } catch (err) {
        console.warn('[realtimeSync] Error in storage event handler:', err);
      }
    }
  };

  // Handle tab refocus to ensure no missed updates
  const handleFocus = () => {
    try {
      onSync({ type: 'WINDOW_FOCUSED' });
    } catch (err) {
      // Non-fatal
    }
  };

  // Register listeners
  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleFocus);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Heartbeat fallback: poll every 3 seconds to guarantee real-time consistency
  const heartbeatId = setInterval(() => {
    try {
      onSync({ type: 'HEARTBEAT' });
    } catch (_) {}
  }, 3000);

  // Return unsubscribe
  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleFocus);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    clearInterval(heartbeatId);
  };
};
