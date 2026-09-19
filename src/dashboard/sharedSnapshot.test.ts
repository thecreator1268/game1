import { describe, expect, it } from 'vitest';
import { decodeSnapshot, encodeSnapshot, type SharedSnapshot } from './sharedSnapshot';

const BASE_SNAPSHOT: SharedSnapshot = {
  patientName: 'Test Patient',
  generatedAt: 1700000000000,
  weeklySummary: 'Attention scores improved this week.',
  domainBalance: [
    { domain: 'memory', sessionCount: 3 },
    { domain: 'attention', sessionCount: 1 },
  ],
  adherenceStreak: 4,
  adherenceSeries: [{ date: '2024-01-01', taken: 2, expected: 2 }],
};

describe('encodeSnapshot / decodeSnapshot', () => {
  it('round-trips a plain-ASCII snapshot', async () => {
    const { data, sig } = await encodeSnapshot(BASE_SNAPSHOT);
    const decoded = await decodeSnapshot(data, sig);
    expect(decoded).toEqual(BASE_SNAPSHOT);
  });

  it('round-trips non-ASCII text (Hindi/Assamese patient names and summaries)', async () => {
    const snapshot: SharedSnapshot = {
      ...BASE_SNAPSHOT,
      patientName: 'सीता देवी',
      weeklySummary: 'এই সপ্তাহত মনোযোগ বৃদ্ধি পাইছে — ঔষধ পালনো ভাল আছিল।',
    };
    const { data, sig } = await encodeSnapshot(snapshot);
    const decoded = await decodeSnapshot(data, sig);
    expect(decoded).toEqual(snapshot);
  });

  it('produces a URL-safe payload with no +, /, or = characters', async () => {
    // Deliberately include characters that would produce + and / in
    // standard base64, and padding-worthy lengths, to catch a
    // non-URL-safe encoder before it ships in an actual shared link.
    const snapshot: SharedSnapshot = { ...BASE_SNAPSHOT, patientName: '???>>>///+++===' };
    const { data, sig } = await encodeSnapshot(snapshot);
    expect(data).not.toMatch(/[+/=]/);
    expect(sig).not.toMatch(/[+/=]/);
  });

  it('rejects a tampered payload (signature mismatch)', async () => {
    const { data, sig } = await encodeSnapshot(BASE_SNAPSHOT);
    const decoded = await decodeSnapshot(data, `${sig.slice(0, -1)}0`);
    expect(decoded).toBeNull();
  });

  it('rejects a tampered signature paired with the original data', async () => {
    const { data } = await encodeSnapshot(BASE_SNAPSHOT);
    const { sig: otherSig } = await encodeSnapshot({ ...BASE_SNAPSHOT, patientName: 'Someone Else' });
    const decoded = await decodeSnapshot(data, otherSig);
    expect(decoded).toBeNull();
  });

  it('rejects garbage input instead of throwing', async () => {
    const decoded = await decodeSnapshot('not-valid-base64!!', 'deadbeef');
    expect(decoded).toBeNull();
  });
});
