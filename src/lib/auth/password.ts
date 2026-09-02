import bcrypt from 'bcryptjs';
import { BCRYPT_COST, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './config';

/**
 * Password hashing and policy.
 *
 * Authority: docs/DECISIONS.md D36 (bcrypt locked),
 *            docs/SECURITY-GUIDELINES.md §2.
 *
 * Plaintext passwords are never stored, never logged and never returned.
 */

export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

export function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export interface PasswordPolicyResult {
  valid: boolean;
  /** Safe to show a user. Never contains the password itself. */
  message?: string;
}

/**
 * Password policy. PROVISIONAL — `OQ-AUTH-02` (length only for Phase 1;
 * complexity and breach-list checking are undecided).
 */
export function checkPasswordPolicy(password: unknown): PasswordPolicyResult {
  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }
  return { valid: true };
}
