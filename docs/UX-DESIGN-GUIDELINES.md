# Anera V2 — UX, UI & Design Guidelines

| Field | Value |
|---|---|
| **Document name** | `docs/UX-DESIGN-GUIDELINES.md` |
| **Status** | **APPROVED** — principles and tooling direction. **Visual tokens, colours, typography and accessibility conformance level are `OPEN / UNDECIDED`.** |
| **Authority** | Derived from [`DECISIONS.md`](DECISIONS.md) — **Decision 31**. Where this document and `DECISIONS.md` disagree, `DECISIONS.md` wins. |
| **Purpose** | The approved UX and design principles for Anera V2, the approved tooling direction, and the gap against current implementation. |
| **Last updated** | 2026-09-01 |

> **No colour, font, or spacing value is approved.** The values currently in the codebase are `CURRENT IMPLEMENTATION`, not an approved design system.

---

## 1. Design philosophy

`APPROVED (D31)` — the governing pair:

> ### **Simple on the surface. Powerful underneath.**

Anera carries a large amount of capability — discovery, matching, communication, Speed Dating, Experiences, Events, Marketplace, Elite, Concierge, an AI layer and a digital economy. The approved philosophy is that this depth **must not surface as complexity**.

The mechanism for this is `APPROVED (D31)` **progressive disclosure**: show what is needed now, reveal depth on demand.

---

## 2. Approved character

`APPROVED (D31)` — Anera's experience is:

| Attribute | Meaning in practice |
|---|---|
| **Human / warm** | The product is about people. The interface should feel like it was made by people, for people. |
| **Intelligent** | It anticipates and assists, within the AI boundaries of D18 and D33 (no silent impersonation). |
| **Premium where appropriate** | Premium is applied selectively — notably to Elite (D23) — not spread uniformly. The qualifier "where appropriate" is part of the approved principle. |
| **Trustworthy** | Trust is a design property, not only a safety feature. This connects directly to D34: safety surfaces must be legible and reachable. |

---

## 3. Approved structural principles

`APPROVED (D31)`:

| Principle | Requirement |
|---|---|
| **Mobile-first** | Design starts at mobile. |
| **Responsive** | The experience adapts across sizes. Breakpoints are `OPEN / UNDECIDED`. |
| **Accessible** | Accessibility is a requirement, not an enhancement. **Conformance level is `OPEN / UNDECIDED`.** |
| **Localization-ready** | The interface is built to be localized. |
| **RTL-ready** | Right-to-left layouts are supported. |
| **Progressive disclosure** | Depth is revealed on demand. |
| **Clear primary action** | Every screen has one obvious primary action. |
| **Meaningful loading / empty / error states** | These states carry information and a path forward — they are not placeholders. |
| **Purposeful motion** | Motion serves comprehension. |
| **Consistent design system** | One system, consistently applied. |

---

## 4. Approved tooling direction

`APPROVED (D31)`:

| Tool | Approved role |
|---|---|
| **shadcn** | **Foundational UI.** The base component layer. |
| **Magic UI** | **Selective use only** — for premium and high-impact visual interactions. |

**Approved usage rules:**

1. **Do not overuse animation.**
2. **Reuse established components and patterns before creating new ones.**

### 4.1 What this means concretely

- shadcn is the default. A new interface element is built from the shadcn layer unless there is a reason it cannot be.
- **Magic UI is an exception path, not a second default.** "Selectively" and "premium/high-impact" are the approved boundary. Reaching for it routinely would violate the approved direction.
- Before creating any new component, check whether an established one already covers the case. This is an approved rule, not a style preference.

### 4.2 Current status of the tooling

| Tool | Status |
|---|---|
| shadcn/ui | `CURRENT IMPLEMENTATION` — already in use, 48 components in `src/components/ui/`, style `new-york`, base colour `neutral`, CSS variables, lucide icons. Consistent with the approved direction. |
| Magic UI | **Not present in the repository.** Adding it is an implementation change requiring an approved phase. A `magic-ui` tooling skill is available to the development environment, but availability is not adoption. |
| Radix UI | `CURRENT IMPLEMENTATION` — the primitive layer beneath shadcn. |
| Framer Motion | `CURRENT IMPLEMENTATION` — used in 12 files. Its continued use is `OPEN / UNDECIDED`; the approved constraint is that animation must be **purposeful and not overused**, whatever the library. |

---

## 5. Surface-specific UX obligations

These follow from approved decisions in other areas. They are recorded here so they are designed for, not discovered.

### 5.1 Monetization UX

`APPROVED (D26)` — no paid feature may guarantee a match, romantic interest, a response or a date. **This binds the copy as much as the code.** Monetization UX must not imply an outcome it cannot deliver.

`APPROVED (D26)` — **all four tiers may purchase eligible extras.** The purchase UX must not present extras as a reason to upgrade a subscription.

`APPROVED (D28)` — **no manipulative personalization; no exploitation of user vulnerability.** This binds upgrade prompts, paywalls, urgency mechanics and scarcity messaging.

`APPROVED (D35)` — local currency and localized pricing must be displayed correctly.

`OPEN / UNDECIDED`: paywall design, upgrade prompt frequency and placement, price presentation rules.

### 5.2 Elite UX

`APPROVED (D31)` — **premium where appropriate**. Elite is the clearest case.

`APPROVED (D34)` — **Elite cannot bypass safety.** A premium experience must not read as a privileged one with respect to consent or safety.

`APPROVED (D28)` — **Elite privacy** is a heightened requirement.

`OPEN / UNDECIDED`: what premium looks like; Elite's visual and interaction differentiation.

### 5.3 Communication UX

`APPROVED (D33)` — **basic human communication must remain fundamentally accessible.** The interface must not make core messaging feel gated.

`APPROVED (D33)` — **AI must not silently impersonate users.** Any AI conversation assistance requires a disclosure model in the UI. The model itself is `OPEN / UNDECIDED`.

`APPROVED (D33, D34)` — blocking and reporting must be reachable from the communication surface.

### 5.4 Discovery UX

`APPROVED (D35)` — **user-controlled discovery expansion.** The expansion ladder (Nearby → City → Region → Country → Global) must be visible and controllable, not silent.

`APPROVED (D34)` — verification signals must not be presented as safety guarantees (rules 4 and 5: verified ≠ safe, unverified ≠ unsafe).

`OPEN / UNDECIDED`: the discovery interface itself, filter presentation, and how expansion is surfaced.

### 5.5 Safety UX

`APPROVED (D34)` — Trust & Safety is a core platform capability. Combined with D31's **trustworthy** principle, safety affordances (block, report, safety information) must be findable and legible, not buried.

`OPEN / UNDECIDED`: placement, wording, and flows.

---

## 6. `OPEN / UNDECIDED`

Nothing below may be inferred from the current codebase, which predates every design decision.

| Item | Status |
|---|---|
| **Colours** — palette, primary, semantic colours | `OPEN / UNDECIDED` |
| **Typography** — typefaces, scale, weights | `OPEN / UNDECIDED` |
| **Spacing scale, radii, elevation** | `OPEN / UNDECIDED` |
| **Any visual design token** | `OPEN / UNDECIDED` |
| **Accessibility conformance target** and whether it gates release | `OPEN / UNDECIDED` |
| **Light mode / theme switching** | `OPEN / UNDECIDED` |
| **Brand identity, logo of record** | `OPEN / UNDECIDED` |
| **Responsive breakpoints** beyond "mobile-first" | `OPEN / UNDECIDED` |
| **Motion specification** — durations, easing curves, reduced-motion handling | `OPEN / UNDECIDED` |
| **Design source of truth** — whether a design file exists and where | `OPEN / UNDECIDED` |
| **Supported languages and RTL locales** | `OPEN / UNDECIDED` — see `GLOBAL-OPERATING-MODEL.md` |
| **Native app strategy** | `OPEN / UNDECIDED` |
| **Component inventory required for V2** | `OPEN / UNDECIDED` |

---

## 7. Current implementation state

`CURRENT IMPLEMENTATION` — verified against the repository. **None of this is approved design.** It is what exists.

### 7.1 What exists

| Aspect | Value |
|---|---|
| Component library | shadcn/ui — style `new-york`, base colour `neutral`, CSS variables, RSC enabled |
| Primitives | Radix UI (~25 packages) |
| Icons | lucide-react |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`; `@theme inline` tokens in `globals.css` |
| Animation | Framer Motion (12 files), `tailwindcss-animate`, `tw-animate-css` |
| Fonts | Geist / Geist Mono via `next/font/google` |
| Theme | **Dark, hard-coded** (`<html className="dark">`); `oklch` tokens; rose/pink primary; near-black plum background; radius `0.75rem`; `themeColor` `#1a0a1e` |
| Light theme | A complete `.light` token set exists in `globals.css` but is **never activated** |
| Layout | Fixed 56px header + flexible main + 64px bottom tab bar; `safe-area-bottom` handling |
| Viewport | `maximumScale: 1`, `userScalable: false` |
| UI inventory | 48 components in `src/components/ui/` |
| Toasts | Radix Toast and `sonner` both present |

### 7.2 Accessibility today

**Present:** `role="tab"`, `aria-label`, `aria-selected` on bottom navigation; `Label`/`htmlFor` pairing on forms; Escape-key and click-outside handling on the notification panel; Radix primitives supplying focus management.

**Absent:** any accessibility standard, audit, contrast verification, screen-reader testing, or reduced-motion handling.

### 7.3 Gaps against approved requirements

**None is to be fixed now.**

| Gap | Description | Approved principle violated |
|---|---|---|
| `IG-03` | **Two conflicting Tailwind configurations.** `tailwind.config.ts` uses v3 conventions with `hsl(var(--…))` colours and content globs (`./app`, `./components`, `./pages`) pointing at directories that do not exist; `globals.css` uses v4 `@theme inline` with `oklch`. Only the v4 path is effective. | Consistent design system |
| `IG-23` | **Viewport locked** — `userScalable: false` and `maximumScale: 1` block pinch-zoom. | Accessible |
| `IG-25` | **No localization, no RTL.** `next-intl` declared and never imported. | Localization-ready, RTL-ready |
| `IG-04` | **Favicon points at an external sandbox-vendor URL** (`z-cdn.chatglm.cn`) while `public/logo.svg` exists unused. | Trustworthy; consistent design system |
| `IG-46` | **No reduced-motion handling** anywhere, despite heavy animation use. | Accessible; purposeful motion |
| `IG-24` | **Dark theme hard-coded**; a complete light token set exists but is unreachable. | Not a conflict — theming is `OPEN` — but recorded as technical debt |
| `IG-47` | **Two toast systems** (Radix Toast and `sonner`) coexist. | Consistent design system; reuse before creating |
| `IG-48` | **No design source of truth**; visual tokens exist only in code and were never approved. | Consistent design system |

---

## 8. Dependencies

| Decision | Relationship |
|---|---|
| D23 Elite & Concierge | Premium where appropriate |
| D26 Monetization | Non-coercive monetization UX; no guaranteed-outcome copy |
| D28 Privacy | No manipulative personalization; no exploitation of vulnerability |
| D29 Analytics | Anti-vanity-engagement principle constrains engagement UX |
| D30 Architecture | Feature flags enable controlled UI rollout |
| D33 Communication | Communication accessibility; AI disclosure; reachable blocking and reporting |
| D34 Trust & Safety | Safety UX; verification badge must not imply safety |
| D35 Global | Localization, RTL, local currency display, user-controlled expansion UX |

---

## 9. Rules for anyone implementing in this area

1. **Do not treat the current visual design as approved.** It predates Decision 31 and no token has been approved.
2. **Do not invent a colour palette, type scale or token set** and present it as the Anera design system.
3. **Use shadcn as the foundation.** It is the approved base layer.
4. **Use Magic UI only selectively**, for premium and high-impact interactions — and only after it is added in an approved phase.
5. **Reuse before creating.** Check the existing 48 components first; this is an approved rule.
6. **Do not overuse animation.**
7. **Do not quantify "accessible" on your own.** The conformance target is undecided.
8. **Every screen needs one clear primary action**, and meaningful loading, empty and error states.
9. **Build localization-ready and RTL-ready**, even before languages are chosen.

---

*Derived from `docs/DECISIONS.md` Decision 31. Items marked `OPEN / UNDECIDED` are tracked in `docs/OPEN-QUESTIONS.md`. Gaps are tracked in `docs/IMPLEMENTATION-GAPS.md`.*
