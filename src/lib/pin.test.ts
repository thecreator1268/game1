import { describe, expect, it } from 'vitest';
import { generatePinSalt, hashPin } from './pin';

describe('generatePinSalt', () => {
  it('returns a non-empty hex string', () => {
    const salt = generatePinSalt();
    expect(salt).toMatch(/^[0-9a-f]+$/);
    expect(salt.length).toBeGreaterThan(0);
  });

  it('returns a different value on each call', () => {
    const salts = new Set(Array.from({ length: 20 }, () => generatePinSalt()));
    expect(salts.size).toBe(20);
  });
});

describe('hashPin', () => {
  it('is deterministic for the same pin and salt', async () => {
    const salt = generatePinSalt();
    const a = await hashPin('1234', salt);
    const b = await hashPin('1234', salt);
    expect(a).toBe(b);
  });

  it('produces a different hash for the same pin under a different salt', async () => {
    const a = await hashPin('1234', 'salt-one');
    const b = await hashPin('1234', 'salt-two');
    expect(a).not.toBe(b);
  });

  it('produces a different hash for a different pin under the same salt', async () => {
    const salt = generatePinSalt();
    const a = await hashPin('1234', salt);
    const b = await hashPin('4321', salt);
    expect(a).not.toBe(b);
  });
});
