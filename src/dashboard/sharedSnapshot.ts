import type { AdherenceDay, DomainBalanceEntry } from './dashboardData';

export interface SharedSnapshot {
  patientName: string;
  generatedAt: number;
  weeklySummary: string;
  domainBalance: DomainBalanceEntry[];
  adherenceStreak: number;
  adherenceSeries: AdherenceDay[];
}

// Not real authentication — there is no server and no private key here, so
// this salt lives in the public client bundle like everything else in this
// app. It only makes a mistyped or hand-edited link detectable (the
// signature won't match), the same "lightweight gate, not a security
// boundary" honesty this project already applies to PIN auth (see
// src/lib/pin.ts) — it does not stop a determined actor from forging one.
const SALT = 'smritisetu-shared-snapshot-v1';

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function sign(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(SALT + payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function encodeSnapshot(snapshot: SharedSnapshot): Promise<{ data: string; sig: string }> {
  const json = JSON.stringify(snapshot);
  return { data: toBase64Url(json), sig: await sign(json) };
}

export async function decodeSnapshot(data: string, sig: string): Promise<SharedSnapshot | null> {
  try {
    const json = fromBase64Url(data);
    const expected = await sign(json);
    if (expected !== sig) return null;
    return JSON.parse(json) as SharedSnapshot;
  } catch {
    return null;
  }
}
