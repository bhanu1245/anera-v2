import { defineConfig } from 'vitest/config';

// Anera V2 — unit + integration test configuration.
// Authority: docs/DECISIONS.md D43 (Vitest locked), docs/TESTING-STRATEGY.md.
//
// E2E lives in tests/e2e and is run by Playwright, not Vitest.
export default defineConfig({
  resolve: {
    // Resolves the `@/*` alias from tsconfig.json natively.
    // TECH-STACK.md §6.6: prefer removing a dependency over adding one —
    // this replaces the vite-tsconfig-paths plugin.
    tsconfigPaths: true,
  },
  test: {
    // Phase 1 tests are node-environment: domain services, route handlers,
    // authorization boundaries and database persistence. Component tests are
    // not in Phase 1 scope, so no DOM environment is configured (D36: minimal).
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    // Integration tests touch a real database; keep them serial to avoid
    // cross-test interference on shared tables.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      // D43: coverage is reported on every run so the number stays visible.
      // No numeric threshold is set — critical-path coverage plus a
      // no-regression ratchet. See TESTING-STRATEGY.md §5.1.
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**', // vendored shadcn/ui primitives
        'src/**/*.d.ts',
      ],
    },
  },
});
