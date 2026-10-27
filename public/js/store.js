// Everything the app remembers lives in localStorage under these keys.
const HISTORY_KEY = 'examTrainer.history.v1';
const RUN_KEY = 'examTrainer.activeRun.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Could not save to localStorage', e);
  }
}

export const loadHistory = () => read(HISTORY_KEY, []);

export function saveAttempt(attempt) {
  const history = loadHistory();
  history.push(attempt);
  write(HISTORY_KEY, history);
}

export const clearHistory = () => write(HISTORY_KEY, null);

export const loadRun = () => read(RUN_KEY, null);
export const saveRun = run => write(RUN_KEY, run);
export const clearRun = () => write(RUN_KEY, null);

export function exportHistory() {
  const blob = new Blob([JSON.stringify(loadHistory(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `exam-trainer-history-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Merges attempts from an exported file; attempts already present (same id) are skipped.
export async function importHistory(file) {
  const incoming = JSON.parse(await file.text());
  if (!Array.isArray(incoming)) throw new Error('not a history file');
  const history = loadHistory();
  const ids = new Set(history.map(a => a.id));
  const added = incoming.filter(a => a && a.id && Array.isArray(a.modules) && !ids.has(a.id));
  const merged = [...history, ...added].sort((a, b) => a.startedAt - b.startedAt);
  write(HISTORY_KEY, merged);
  return added.length;
}
