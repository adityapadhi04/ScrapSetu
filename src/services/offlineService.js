/**
 * ScrapSetu — Offline Service (Module 10)
 *
 * Centralized connectivity state manager.
 * Wraps navigator.onLine and browser window events.
 *
 * This is a plain JS singleton — no React dependency.
 * React components subscribe via subscribeToConnectivity().
 */

/** @type {Array<(isOnline: boolean) => void>} */
const _listeners = [];

/**
 * Notify all registered subscribers of the current connectivity state.
 * @param {boolean} isOnline
 */
const _notify = (isOnline) => {
  _listeners.forEach((cb) => {
    try {
      cb(isOnline);
    } catch (err) {
      console.error('[offlineService] subscriber error:', err);
    }
  });
};

// Wire browser-level events once at module load time.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => _notify(true));
  window.addEventListener('offline', () => _notify(false));
}

let _simulatedOnline = null;

/**
 * Returns true if the browser reports an active network connection.
 * Note: navigator.onLine only confirms a local network is present,
 * not necessarily real internet access.
 * @returns {boolean}
 */
export const isOnline = () => {
  if (_simulatedOnline !== null) return _simulatedOnline;
  if (typeof navigator === 'undefined') return true; // SSR/test fallback
  return navigator.onLine;
};

/**
 * Returns true if the browser is offline.
 * @returns {boolean}
 */
export const isOffline = () => !isOnline();

/**
 * Returns the current online status.
 * @returns {boolean}
 */
export const getOnlineStatus = () => isOnline();

/**
 * Set a simulated online/offline state (useful for tests and dev toggles).
 * Passes true/false, or null to restore native navigator.onLine.
 * @param {boolean|null} status
 */
export const setSimulatedOnline = (status) => {
  _simulatedOnline = status;
  if (status !== null) {
    _notify(status);
  }
};

/**
 * Reset simulated connectivity back to native navigator.onLine.
 */
export const resetSimulatedOnline = () => {
  _simulatedOnline = null;
  if (typeof navigator !== 'undefined') {
    _notify(navigator.onLine);
  }
};

/**
 * Subscribe to connectivity changes.
 * The callback receives a boolean: true = online, false = offline.
 *
 * Returns an unsubscribe function.
 *
 * @param {(isOnline: boolean) => void} callback
 * @returns {() => void} unsubscribe
 */
export const subscribeToConnectivity = (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('[offlineService] subscribeToConnectivity requires a function');
  }
  _listeners.push(callback);

  // Return an unsubscribe function
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
};

/**
 * Returns the number of active subscribers (useful for testing/debugging).
 * @returns {number}
 */
export const getSubscriberCount = () => _listeners.length;

const offlineService = {
  isOnline,
  isOffline,
  getOnlineStatus,
  subscribeToConnectivity,
  getSubscriberCount,
  setSimulatedOnline,
  resetSimulatedOnline,
};

export default offlineService;
