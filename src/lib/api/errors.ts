import { NextResponse } from 'next/server';

/**
 * Anera V2 — validation error responses.
 *
 * Authority: docs/API-SPECIFICATION.md §2 — the error envelope is
 * `{ error: { code, message, details } }`.
 *
 * The simple `apiError(status, code, message)` lives in `src/lib/auth/guard.ts`
 * and is reused as-is; that module is frozen (M4), so this adds the
 * `details`-bearing variant alongside rather than editing it. Both produce the
 * same envelope — there is one response shape, not two.
 */

export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * 400 with per-field detail.
 *
 * `details` describes the caller's own submitted input, so it reveals nothing
 * about other users or about server internals — the constraint
 * `API-SPECIFICATION.md` §2 places on error messages.
 */
export function validationError(details: ErrorDetail[], message = 'Validation failed.') {
  return NextResponse.json(
    { error: { code: 'VALIDATION_FAILED', message, details } },
    { status: 400 },
  );
}
