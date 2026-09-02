import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, checkPasswordPolicy } from '@/lib/auth/password';
import { BCRYPT_COST, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/config';

/**
 * Anera V2 — password hashing and policy (M4 test requirement 3).
 *
 * Authority: docs/DECISIONS.md D36 (bcrypt locked),
 *            docs/SECURITY-GUIDELINES.md §2, docs/AUTHENTICATION.md §5.
 *
 * The policy VALUES are provisional (`OQ-AUTH-02`); these tests assert the
 * behaviour against the configured constants rather than hard-coded numbers,
 * so ratifying the open question does not invalidate the suite.
 */

describe('password hashing', () => {
  it('produces a bcrypt hash at the configured cost, never the plaintext', async () => {
    const hash = await hashPassword('correct-horse-battery');

    expect(hash).not.toContain('correct-horse-battery');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash.split('$')[2]).toBe(String(BCRYPT_COST).padStart(2, '0'));
  });

  it('salts each hash, so identical passwords do not collide', async () => {
    const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
    expect(a).not.toBe(b);
  });

  it('verifies the correct password and rejects everything else', async () => {
    const hash = await hashPassword('correct-horse-battery');

    expect(await verifyPassword('correct-horse-battery', hash)).toBe(true);
    expect(await verifyPassword('correct-horse-batter', hash)).toBe(false);
    expect(await verifyPassword('Correct-Horse-Battery', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('rejects a password against a hash it did not produce', async () => {
    const hash = await hashPassword('first-password');
    expect(await verifyPassword('second-password', hash)).toBe(false);
  });
});

describe('password policy', () => {
  it('accepts a password within the configured length bounds', () => {
    expect(checkPasswordPolicy('x'.repeat(PASSWORD_MIN_LENGTH)).valid).toBe(true);
    expect(checkPasswordPolicy('x'.repeat(PASSWORD_MAX_LENGTH)).valid).toBe(true);
  });

  it('rejects a password shorter than the minimum', () => {
    const result = checkPasswordPolicy('x'.repeat(PASSWORD_MIN_LENGTH - 1));
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('rejects a password longer than the maximum', () => {
    // An unbounded password is a denial-of-service vector: bcrypt cost is
    // paid by the server, not the caller.
    expect(checkPasswordPolicy('x'.repeat(PASSWORD_MAX_LENGTH + 1)).valid).toBe(false);
  });

  it('rejects missing and non-string values without throwing', () => {
    for (const value of [undefined, null, '', 12345678, {}, []]) {
      expect(checkPasswordPolicy(value).valid).toBe(false);
    }
  });

  it('never echoes the password back in the rejection message', () => {
    const secret = 'Zq7Xk2!'; // shorter than the minimum, so it is rejected
    const result = checkPasswordPolicy(secret);
    expect(result.valid).toBe(false);
    expect(result.message).not.toContain(secret);
  });
});
