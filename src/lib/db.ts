import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a fresh client to ensure latest schema is available
export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

// Enable SQLite foreign key enforcement (disabled by default in SQLite)
// This ensures cascade deletes and FK constraints work properly
db.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`).catch(() => {
  // Ignore errors if not using SQLite
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
