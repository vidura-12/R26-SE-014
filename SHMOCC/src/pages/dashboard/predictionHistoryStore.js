// ============================================================
// PREDICTION HISTORY STORE
// ------------------------------------------------------------
// Lightweight localStorage-backed store shared between the
// Sensor Data page (writes a record after every prediction) and
// the History page (reads + displays them). Dispatches a custom
// event so any mounted components stay in sync within the same tab.
// ============================================================

const STORAGE_KEY = "wrr_prediction_history";
const MAX_RECORDS = 300;
const EVENT_NAME = "prediction-history-updated";

export function getPredictionHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPredictionRecord(record) {
  const existing = getPredictionHistory();

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...record,
  };

  const updated = [entry, ...existing].slice(0, MAX_RECORDS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — fail silently, entry just won't persist
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));

  return entry;
}

export function clearPredictionHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }));
}

export function subscribeToPredictionHistory(callback) {
  const handler = (e) => callback(e.detail ?? getPredictionHistory());
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}