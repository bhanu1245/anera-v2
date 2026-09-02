import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

/**
 * Phase 1 Step 7 — verification of the test infrastructure itself.
 *
 * Authority: docs/DECISIONS.md D43, docs/TESTING-STRATEGY.md.
 *
 * This suite proves the harness works before any application test relies on it:
 * the runner executes, assertions fail when they should, and the `@/*` path
 * alias from tsconfig.json resolves inside Vitest.
 *
 * It is NOT part of the Phase 1 gate in TESTING-STRATEGY.md §4 — it verifies
 * the tooling, not the product.
 */
describe('test infrastructure', () => {
  it('runs the test runner', () => {
    expect(true).toBe(true);
  });

  it('reports failures rather than silently passing', () => {
    // Guards against a misconfigured runner that reports success regardless.
    expect(() => {
      expect(1).toBe(2);
    }).toThrow();
  });

  it('resolves the @/* path alias into src/', () => {
    // Proves vite-tsconfig-paths is wired; without it this import fails.
    expect(typeof cn).toBe('function');
    expect(cn('a', 'b')).toContain('a');
  });

  it('runs in the node environment', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.versions.node).toBe('string');
  });
});
