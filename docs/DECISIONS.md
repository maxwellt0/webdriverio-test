# Decisions — Test Automation

Technical and design decisions made building the test automation, with the rationale behind each. Decisions are listed in chronological order; the latest is the current state.

---

## DEC-1 — Test folder layout

**Decision:** Under `tests/`, organize code into five top-level folders:

```
tests/
├── core/       # Abstract base classes (base.page.ts, future base.component.ts, etc.)
├── pages/      # Concrete page objects (auth.page.ts, play.page.ts, profile.page.ts, history.page.ts)
├── features/   # Higher-level workflows that compose multiple page actions
│               # (e.g. register-and-play.feature.ts, finish-game.feature.ts)
├── specs/      # Mocha spec files — one per area, mirrors docs/test-cases/
└── utils/      # Cross-cutting helpers (test-data generators, confirm-dialog handler,
                # localStorage helpers, i18n string map, etc.)
```

**Naming convention:** kebab-case filenames with a role suffix — `base.page.ts`, `auth.page.ts`, `register-and-play.feature.ts`, `<area>.spec.ts`. Class names stay PascalCase (`BasePage`, `AuthPage`, …) so the file/class distinction is unambiguous at a glance.

**Why:**
- The SUT is small (one HTML file, ~7 testable views), so a deep / role-rich structure (e.g. separate `components/`, `fixtures/`, `selectors/`, `actions/`) would be over-engineering. Five folders cover the necessary separations without the bureaucracy.
- The separation of `pages/` from `features/` keeps individual page objects narrow (one page = one set of locators + atomic actions) while still giving a home for the slightly higher-level user-journey helpers that the critical-flow specs will compose.
- `core/` exists specifically so the abstract `BasePage` (and any future siblings) don't sit alongside concrete pages — concrete pages are an inheritance leaf, abstractions are not.
- `utils/` is a deliberate catch-all; anything that has no clean home goes there with a justification in its own file header.

**How to apply:**
- New page object → `tests/pages/<Name>Page.ts`, extending `BasePage` from `tests/core/`.
- New cross-page workflow → `tests/features/<workflow>.ts`. If it would only ever be called from one spec, inline it instead.
- New helper → `tests/utils/`. If a util grows into a class or starts owning state, consider promoting it to `core/`.
- Specs (`tests/specs/`) only consume the above. Spec files should not contain low-level WDIO calls beyond `before` / `beforeEach` hooks; everything goes through page / feature / util modules.

---

---

## DEC-2 — Linter & formatter: ESLint 9 (flat config) + Prettier

**Decision:** ESLint 9 with the flat-config format (`eslint.config.mjs`) for linting, Prettier 3 for formatting, `eslint-config-prettier` to disable ESLint rules that overlap with Prettier.

**Why:**
- Industry-standard pair for TypeScript projects. Reviewers recognize the toolchain immediately; no learning curve.
- Flat config (ESLint 9+) is the future direction of ESLint; starting on it avoids a forced migration.
- Prettier owns formatting (single source of truth — no ESLint stylistic rules), ESLint owns code quality. Clean separation avoids the historical lint/format conflict.
- Alternatives considered: **Biome** (faster, all-in-one) was rejected because it is less recognized by reviewers; **standalone Prettier without ESLint** was rejected because it doesn't catch unused imports, dead code, type misuse, etc.

**How to apply:**
- `npm run lint` — check code; `npm run lint:fix` — auto-fix what ESLint can.
- `npm run format` — write Prettier-formatted output; `npm run format:check` — fail in CI if formatting drift.
- The SUT (`src/`) and all docs (`*.md`) are ignored — the SUT is not ours to modify, and docs are hand-formatted.
- Config lives at the repo root: `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`.
- Lint/format are not run inside the test container — they're a host-side / CI concern, not a runtime dependency of the test suite.

---

*Further decisions (framework choice, locator strategy, Docker layout, sync model, bug-handling convention, etc.) to be added as they are made.*