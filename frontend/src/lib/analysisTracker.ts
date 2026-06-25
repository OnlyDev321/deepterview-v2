const STORAGE_KEY = "analyzingSessionIds";

function getAnalyzingIds(): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveAnalyzingIds(ids: number[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function markAnalyzing(sessionId: number) {
  const ids = getAnalyzingIds();
  if (!ids.includes(sessionId)) {
    ids.push(sessionId);
    saveAnalyzingIds(ids);
  }
}

export function unmarkAnalyzing(sessionId: number) {
  const ids = getAnalyzingIds().filter((id) => id !== sessionId);
  saveAnalyzingIds(ids);
}

export function isAnalyzing(sessionId: number): boolean {
  return getAnalyzingIds().includes(sessionId);
}
