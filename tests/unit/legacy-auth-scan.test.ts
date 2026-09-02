import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

/**
 * Anera V2 — executable legacy-authentication scan (M4 test requirements
 * 22, 24, 27, and the M4 legacy-scan gate).
 *
 * Authority: docs/DECISIONS.md D37 §2 (the seven prohibitions), D40
 *            (legacy replacement policy), docs/AUTHENTICATION.md §8.
 *
 * The prohibited patterns are architectural, so a reviewer cannot be the
 * only thing keeping them out — reintroducing one must break the build.
 *
 * Scope note: comments are stripped before scanning. AUTHENTICATION.md and
 * the source headers are REQUIRED to name these patterns in order to record
 * what was removed and why; the prohibition is on executable code, and this
 * suite must not create pressure to delete that documentation.
 */

const SRC = path.join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Removes block and line comments so documentation prose is not scanned. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

interface Source {
  file: string;
  rel: string;
  code: string;
}

const SOURCES: Source[] = sourceFiles(SRC).map((file) => ({
  file,
  rel: path.relative(process.cwd(), file).replace(/\\/g, '/'),
  code: stripComments(readFileSync(file, 'utf8')),
}));

/** Files whose executable code matches the pattern. */
function offenders(pattern: RegExp): string[] {
  return SOURCES.filter((s) => pattern.test(s.code)).map((s) => s.rel);
}

describe('the scan itself is sound', () => {
  it('reads a meaningful number of source files', () => {
    // Guards against a silently empty scan reporting a false pass.
    expect(SOURCES.length).toBeGreaterThan(20);
  });

  it('strips comments but keeps code', () => {
    const stripped = stripComments('// no localStorage here\nconst a = 1; /* Bearer */ const b = 2;');
    expect(stripped).not.toContain('localStorage');
    expect(stripped).not.toContain('Bearer');
    expect(stripped).toContain('const a = 1;');
    expect(stripped).toContain('const b = 2;');
  });

  it('still detects a prohibited pattern in real code', () => {
    // Proves the matcher works, so a clean result means something.
    const fake: Source[] = [{ file: 'x', rel: 'x', code: "localStorage.getItem('token')" }];
    expect(fake.filter((s) => /localStorage/.test(s.code))).toHaveLength(1);
  });
});

describe('22. no client-side authentication token storage', () => {
  it('has no executable localStorage or sessionStorage access', () => {
    expect(offenders(/\b(localStorage|sessionStorage)\s*\./)).toEqual([]);
    expect(offenders(/\bwindow\.(localStorage|sessionStorage)\b/)).toEqual([]);
  });

  it('does not persist Zustand auth state to browser storage', () => {
    const store = SOURCES.find((s) => s.rel.endsWith('src/stores/auth-store.ts'));
    expect(store, 'auth-store.ts not found').toBeDefined();
    expect(store!.code).not.toMatch(/\bpersist\s*\(/);
    expect(store!.code).not.toMatch(/createJSONStorage/);
  });
});

describe('23. no Bearer authentication transport', () => {
  it('never sets or reads an Authorization header', () => {
    expect(offenders(/['"`]Bearer[\s'"`]/)).toEqual([]);
    expect(offenders(/Authorization['"`]?\s*:/i)).toEqual([]);
    expect(offenders(/headers\.get\(\s*['"`]authorization['"`]/i)).toEqual([]);
  });

  it('does not advertise Authorization as an allowed CORS request header', () => {
    // The legacy proxy allowed it, which invited Bearer transport back in.
    expect(offenders(/Access-Control-Allow-Headers[\s\S]{0,80}Authorization/i)).toEqual([]);
  });
});

describe('24. no client-side authentication readiness or hydration gate', () => {
  it('has no authReady, waitForAuth or retry-until-authenticated mechanism', () => {
    expect(offenders(/\bauthReady\b/)).toEqual([]);
    expect(offenders(/\bwaitForAuth\b/)).toEqual([]);
  });

  it('has no hasHydrated flag used as authentication', () => {
    expect(offenders(/\bhasHydrated\b/)).toEqual([]);
    expect(offenders(/\bsetHasHydrated\b/)).toEqual([]);
  });

  it('has no client-side isAuthenticated flag that could override the server', () => {
    expect(offenders(/\bisAuthenticated\b/)).toEqual([]);
  });
});

describe('no legacy session cryptography', () => {
  it('has no HMAC session architecture', () => {
    expect(offenders(/createHmac|createHash\s*\(\s*['"`]sha256['"`]\s*\)[\s\S]{0,120}session/i)).toEqual(
      [],
    );
  });

  it('has no in-memory revocation blocklist', () => {
    // The MVP kept revoked tokens in a Set, which every restart emptied.
    expect(offenders(/\brevokedTokens\b/)).toEqual([]);
  });

  it('has no JWT or stateless signed token', () => {
    expect(offenders(/\bjsonwebtoken\b|\bjose\b|\bjwt\.(sign|verify)\b/)).toEqual([]);
  });

  it('has no next-auth usage', () => {
    expect(offenders(/next-auth/)).toEqual([]);
  });

  it('has no SESSION_SECRET or hard-coded secret fallback', () => {
    expect(offenders(/SESSION_SECRET/)).toEqual([]);
    expect(offenders(/process\.env\.\w*SECRET\w*\s*(\|\||\?\?)\s*['"`]/)).toEqual([]);
  });
});

describe('27. only credential-verifying routes can grant a session', () => {
  const routeFiles = SOURCES.filter((s) => /src\/app\/api\/.*\/route\.ts$/.test(s.rel));
  const GRANTS_SESSION = /setSessionCookie|createSession\s*\(/;

  it('finds the API route surface', () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it('grants sessions from login and register only', () => {
    const granting = routeFiles.filter((s) => GRANTS_SESSION.test(s.code)).map((s) => s.rel);
    expect(granting.sort()).toEqual([
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/register/route.ts',
    ]);
  });

  it('verifies a credential before granting a session', () => {
    const login = SOURCES.find((s) => s.rel === 'src/app/api/auth/login/route.ts')!;
    const register = SOURCES.find((s) => s.rel === 'src/app/api/auth/register/route.ts')!;

    expect(login.code).toMatch(/verifyPassword/);
    // Registration establishes the credential it then trusts.
    expect(register.code).toMatch(/hashPassword/);
    expect(register.code).toMatch(/checkPasswordPolicy/);
  });

  it('rate-limits every session-granting route', () => {
    for (const rel of ['src/app/api/auth/login/route.ts', 'src/app/api/auth/register/route.ts']) {
      expect(SOURCES.find((s) => s.rel === rel)!.code, rel).toMatch(/rateLimit\s*\(/);
    }
  });

  it('guards every non-auth API route with the one server-side check', () => {
    const unguarded = routeFiles
      .filter((s) => !s.rel.startsWith('src/app/api/auth/'))
      .filter((s) => !/requireAuth\s*\(|requireOwnership\s*\(/.test(s.code))
      .map((s) => s.rel);

    expect(unguarded).toEqual([]);
  });

  it('derives the acting user identity from the session, never from the request', () => {
    for (const route of routeFiles.filter((s) => !s.rel.startsWith('src/app/api/auth/'))) {
      // A route may read a userId from the body only to ignore it; it must
      // not assign one from client input into the identity used for writes.
      expect(route.code, route.rel).not.toMatch(
        /const\s*\{[^}]*\buserId\b[^}]*\}\s*=\s*(body|formData|await\s+request|searchParams)/,
      );
    }
  });
});

describe('the session cookie is the only authentication transport', () => {
  it('reads the session id from cookies alone, with no header fallback', () => {
    const session = SOURCES.find((s) => s.rel === 'src/lib/auth/session.ts')!;
    expect(session.code).toMatch(/request\.cookies\.get\(/);
    expect(session.code).not.toMatch(/headers\.get\(/);
  });

  it('sets HttpOnly and SameSite on the session cookie', () => {
    const session = SOURCES.find((s) => s.rel === 'src/lib/auth/session.ts')!;
    expect(session.code).toMatch(/httpOnly:\s*true/);
    expect(session.code).toMatch(/sameSite:\s*['"`]lax['"`]/);
    expect(session.code).toMatch(/path:\s*['"`]\/['"`]/);
  });

  it('has exactly one server-side session validator', () => {
    const definitions = SOURCES.filter((s) =>
      /export\s+(async\s+)?function\s+validateSession\b/.test(s.code),
    ).map((s) => s.rel);
    expect(definitions).toEqual(['src/lib/auth/session.ts']);
  });
});
