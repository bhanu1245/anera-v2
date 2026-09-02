/**
 * Loads .env for integration tests.
 *
 * Uses Node's built-in loadEnvFile rather than adding a dotenv dependency
 * (TECH-STACK.md §6.1: do not add a technology the phase does not require).
 * In CI, DATABASE_URL is supplied by the workflow environment and no .env
 * file exists, so a missing file is not an error.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env file — expected in CI, where the environment provides the values.
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Integration tests require a real PostgreSQL ' +
      'database (D36). Mocks and in-memory substitutes are prohibited (D40).',
  );
}
