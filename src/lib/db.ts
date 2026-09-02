import { PrismaClient } from '@prisma/client'

// Anera V2 — Prisma client.
// Authority: docs/DECISIONS.md D36 (PostgreSQL + Prisma), D40 (legacy removal).
//
// The SQLite `PRAGMA foreign_keys = ON` statement that used to run here was
// removed in Phase 1 M3: it is SQLite-specific and failed against PostgreSQL
// with `42601 syntax error at or near "PRAGMA"` on every client construction.
// The error was swallowed by a .catch(), so it logged noise rather than
// breaking. PostgreSQL enforces foreign keys natively and unconditionally.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Reuse a single client across module reloads in development. The MVP
// deliberately removed this singleton to work around a stale-client bug,
// which risked connection exhaustion under hot reload (IG-60/TI-01); the
// underlying schema-staleness cause no longer applies now that the client is
// generated from the PostgreSQL schema.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
