const STORAGE_KEY = "analysisNotifications";

export interface AnalysisNotification {
  id: string;
  sessionId: number;
  completedAt: string;
  read: boolean;
}

function loadAll(): AnalysisNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalysisNotification[]) : [];
  } catch {
    return [];
  }
}

function saveAll(notifications: AnalysisNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function addNotification(sessionId: number) {
  const notifications = loadAll();
  const exists = notifications.some((n) => n.sessionId === sessionId);
  if (exists) return;

  notifications.unshift({
    id: `${sessionId}-${Date.now()}`,
    sessionId,
    completedAt: new Date().toISOString(),
    read: false,
  });

  saveAll(notifications);
}

export function getNotifications(): AnalysisNotification[] {
  return loadAll();
}

export function getUnreadCount(): number {
  return loadAll().filter((n) => !n.read).length;
}

export function markAsRead(id: string) {
  const notifications = loadAll();
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
    saveAll(notifications);
  }
}

export function markAllAsRead() {
  const notifications = loadAll();
  for (const n of notifications) {
    n.read = true;
  }
  saveAll(notifications);
}

export function dismissNotification(id: string) {
  const notifications = loadAll().filter((n) => n.id !== id);
  saveAll(notifications);
}

export function dismissAll() {
  localStorage.removeItem(STORAGE_KEY);
}
