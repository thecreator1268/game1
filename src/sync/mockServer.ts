// Stand-in for a real backend's /sync endpoint. Simulates network latency so
// the offline→online demo has a visible "syncing" moment, and keeps a running
// received-count in localStorage so the demo panel can show that a request
// actually "landed" somewhere, without standing up real infrastructure.
export interface SyncPayload {
  sessions: unknown[];
  reminderLogs: unknown[];
}

const RECEIVED_KEY = 'smriti-setu-mock-server-received-count';

export async function mockSyncRequest(payload: SyncPayload): Promise<{ ok: true; receivedCount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  const receivedCount = payload.sessions.length + payload.reminderLogs.length;
  try {
    const prev = Number(localStorage.getItem(RECEIVED_KEY) ?? '0');
    localStorage.setItem(RECEIVED_KEY, String(prev + receivedCount));
  } catch {
    // Private browsing / storage disabled — non-fatal, sync still "succeeds".
  }
  return { ok: true, receivedCount };
}

export function getMockServerReceivedCount(): number {
  try {
    return Number(localStorage.getItem(RECEIVED_KEY) ?? '0');
  } catch {
    return 0;
  }
}
