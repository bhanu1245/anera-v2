import type { NextConfig } from "next";

// Anera V2 — Next.js configuration.
// Authority: docs/DECISIONS.md D36 (stack), D40 (legacy/sandbox removal),
//            D43 (type errors must block the build).
const nextConfig: NextConfig = {
  // D43 / TESTING-STRATEGY.md §5: `typescript.ignoreBuildErrors` is removed.
  // Type errors now fail the production build.

  reactStrictMode: true,

  // D40: the `.space-z.ai` and Caddy preview origins were sandbox coupling
  // (IG-53) and have been removed. `output: "standalone"` was part of the
  // same sandbox packaging and is likewise removed; deployment topology is
  // OQ-B04 and will be decided before Phase 1 ships.

  images: {
    // Remote patterns for the deleted demo/seed fixtures (randomuser.me,
    // i.pravatar.cc) were removed with those endpoints. Media architecture
    // is OQ-A03 and is decided in its owning phase.
    remotePatterns: [],
  },
};

export default nextConfig;
