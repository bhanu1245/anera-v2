import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Phase 1 Milestone 3 — PostgreSQL foundation verification.
 *
 * Authority: docs/BACKEND-SCHEMA.md §2, docs/DECISIONS.md D36 (PostgreSQL),
 *            D28 (foreign keys / reliable erasure),
 *            docs/TESTING-STRATEGY.md §4.2 (#13 restart, #14 persistence,
 *            #9 multi-account isolation, #15 authorization isolation).
 *
 * These run against a REAL PostgreSQL database. Mocks, SQLite and in-memory
 * substitutes are prohibited (D40, D36). If DATABASE_URL is absent the suite
 * fails rather than silently degrading.
 */

const prisma = new PrismaClient();

// Unique per run so repeat runs never collide.
const RUN = `m3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = (n: string) => `${RUN}-${n}@test.invalid`;

async function cleanup() {
  // Cascades remove profiles, photos, interests, preferences and sessions.
  await prisma.user.deleteMany({ where: { email: { startsWith: RUN } } });
}

beforeAll(async () => {
  await prisma.$connect();
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('PostgreSQL foundation', () => {
  it('connects to a real PostgreSQL 16 server', async () => {
    const [{ version }] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
    expect(version).toContain('PostgreSQL');
    expect(version).toMatch(/PostgreSQL 16\./);
    // Guards against silently falling back to SQLite (D36 / IG-58).
    expect(version).not.toContain('SQLite');
  });

  it('contains exactly the approved Phase 1 foundation tables', async () => {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name NOT LIKE '\\_prisma%'
      ORDER BY table_name
    `;
    const tables = rows.map((r) => r.table_name);

    // BACKEND-SCHEMA.md §2 — the six foundation tables, and nothing more.
    expect(tables).toEqual([
      'photos',
      'preferences',
      'profile_interests',
      'profiles',
      'sessions',
      'users',
    ]);
  });

  it('has no future-phase tables (BACKEND-SCHEMA.md §2 rule 3)', async () => {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `;
    const tables = rows.map((r) => r.table_name);
    for (const forbidden of ['swipes', 'matches', 'blocks', 'messages', 'notifications', 'subscriptions']) {
      expect(tables).not.toContain(forbidden);
    }
  });
});

describe('database persistence', () => {
  it('persists a user and reads it back', async () => {
    const created = await prisma.user.create({
      data: { email: email('persist'), passwordHash: 'not-a-real-hash' },
    });

    const found = await prisma.user.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found?.email).toBe(created.email);
    expect(found?.status).toBe('active');
  });

  it('persists across an independent client connection', async () => {
    const created = await prisma.user.create({
      data: { email: email('independent'), passwordHash: 'not-a-real-hash' },
    });

    // A second client proves the row is in the server, not in process memory.
    const other = new PrismaClient();
    try {
      const found = await other.user.findUnique({ where: { id: created.id } });
      expect(found?.email).toBe(created.email);
    } finally {
      await other.$disconnect();
    }
  });

  it('persists a full profile graph', async () => {
    const user = await prisma.user.create({
      data: {
        email: email('graph'),
        passwordHash: 'not-a-real-hash',
        profile: {
          create: {
            displayName: 'Graph User',
            birthDate: new Date('1995-06-15'),
            gender: 'female',
            city: 'Mumbai',
            photos: { create: [{ url: 'https://example.invalid/a.jpg', order: 0, isPrimary: true }] },
            interests: { create: [{ interest: 'Travel' }, { interest: 'Music' }] },
          },
        },
        preferences: { create: { minAge: 25, maxAge: 40, genderPreference: 'male' } },
      },
      include: { profile: { include: { photos: true, interests: true } }, preferences: true },
    });

    expect(user.profile?.displayName).toBe('Graph User');
    expect(user.profile?.photos).toHaveLength(1);
    expect(user.profile?.interests.map((i) => i.interest).sort()).toEqual(['Music', 'Travel']);
    expect(user.preferences?.minAge).toBe(25);

    // birthDate is stored, not a derived age (BACKEND-SCHEMA.md §2.1).
    expect(user.profile?.birthDate.toISOString()).toContain('1995-06-15');
  });

  it('enforces the unique email constraint', async () => {
    const addr = email('unique');
    await prisma.user.create({ data: { email: addr, passwordHash: 'not-a-real-hash' } });
    await expect(
      prisma.user.create({ data: { email: addr, passwordHash: 'not-a-real-hash' } }),
    ).rejects.toThrow();
  });

  it('enforces one profile per user', async () => {
    const user = await prisma.user.create({
      data: { email: email('oneprofile'), passwordHash: 'not-a-real-hash' },
    });
    await prisma.profile.create({
      data: { userId: user.id, displayName: 'A', birthDate: new Date('1990-01-01'), gender: 'male' },
    });
    await expect(
      prisma.profile.create({
        data: { userId: user.id, displayName: 'B', birthDate: new Date('1990-01-01'), gender: 'male' },
      }),
    ).rejects.toThrow();
  });
});

describe('cascade deletion (D28 — reliable erasure)', () => {
  it('removes every dependent row when a user is deleted', async () => {
    const user = await prisma.user.create({
      data: {
        email: email('cascade'),
        passwordHash: 'not-a-real-hash',
        sessions: { create: { expiresAt: new Date(Date.now() + 3_600_000) } },
        profile: {
          create: {
            displayName: 'Cascade User',
            birthDate: new Date('1992-03-03'),
            gender: 'other',
            photos: { create: [{ url: 'https://example.invalid/c.jpg' }] },
            interests: { create: [{ interest: 'Reading' }] },
          },
        },
        preferences: { create: {} },
      },
      include: { profile: true },
    });
    const profileId = user.profile!.id;

    await prisma.user.delete({ where: { id: user.id } });

    // This is the guarantee the MVP could not make — it had FKs on only
    // 2 of 10 models, so deletion orphaned rows across seven tables (IG-12).
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.profile.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.photo.count({ where: { profileId } })).toBe(0);
    expect(await prisma.profileInterest.count({ where: { profileId } })).toBe(0);
    expect(await prisma.preferences.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe('multi-account isolation', () => {
  it('keeps two accounts and their graphs fully separate', async () => {
    const a = await prisma.user.create({
      data: {
        email: email('iso-a'),
        passwordHash: 'not-a-real-hash',
        profile: { create: { displayName: 'Alice', birthDate: new Date('1994-01-01'), gender: 'female' } },
      },
      include: { profile: true },
    });
    const b = await prisma.user.create({
      data: {
        email: email('iso-b'),
        passwordHash: 'not-a-real-hash',
        profile: { create: { displayName: 'Bob', birthDate: new Date('1993-02-02'), gender: 'male' } },
      },
      include: { profile: true },
    });

    expect(a.id).not.toBe(b.id);
    expect(a.profile!.id).not.toBe(b.profile!.id);

    // A scoped read — the shape every authorization check must use — returns
    // only the owner's row (TESTING-STRATEGY.md §4.2 #15).
    const aScoped = await prisma.profile.findFirst({ where: { id: a.profile!.id, userId: a.id } });
    const crossScoped = await prisma.profile.findFirst({ where: { id: b.profile!.id, userId: a.id } });

    expect(aScoped?.displayName).toBe('Alice');
    expect(crossScoped).toBeNull(); // A cannot reach B's profile by ownership scope.

    // Deleting A leaves B entirely intact.
    await prisma.user.delete({ where: { id: a.id } });
    expect(await prisma.user.findUnique({ where: { id: b.id } })).not.toBeNull();
    expect(await prisma.profile.count({ where: { userId: b.id } })).toBe(1);
  });
});

describe('session records (D37 foundation)', () => {
  it('stores sessions server-side and revokes them by deletion', async () => {
    const user = await prisma.user.create({
      data: { email: email('session'), passwordHash: 'not-a-real-hash' },
    });
    const session = await prisma.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
    });

    expect(await prisma.session.findUnique({ where: { id: session.id } })).not.toBeNull();

    // Revocation is a row delete and takes effect immediately — replacing the
    // MVP's in-memory blocklist that was lost on restart (IG-70).
    await prisma.session.delete({ where: { id: session.id } });
    expect(await prisma.session.findUnique({ where: { id: session.id } })).toBeNull();
  });

  it('can distinguish expired from live sessions', async () => {
    const user = await prisma.user.create({
      data: { email: email('expiry'), passwordHash: 'not-a-real-hash' },
    });
    await prisma.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() - 1000) },
    });
    await prisma.session.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + 3_600_000) },
    });

    const live = await prisma.session.count({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
    });
    expect(live).toBe(1);
  });
});
