/**
 * Decorative background gradient.
 *
 * Extracted verbatim from the single-page shell in M5 so the auth, onboarding
 * and profile routes can share it. Pure markup with no hooks and no state, so
 * it stays a Server Component and adds nothing to the client bundle.
 *
 * Visual design tokens are `OPEN / UNDECIDED` (UX-DESIGN-GUIDELINES.md §6);
 * this is the existing appearance moved, not a design decision.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-primary/8 blur-[100px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />
    </div>
  );
}
