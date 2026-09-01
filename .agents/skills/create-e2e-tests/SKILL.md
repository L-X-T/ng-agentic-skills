---
name: create-e2e-tests
description: Create end-to-end (e2e) tests for an Angular component using Playwright or Cypress. Use when the user wants e2e or browser tests, a Cypress `.cy.ts` spec, a Playwright e2e `.spec.ts`, or mentions testing a component in a real browser. Detects the configured platform (asks only when both or neither are set up), scaffolds it when missing, then writes and runs the spec. Not for unit or TestBed component tests – use ng-testing for those.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Create e2e tests

Write one behavior-level e2e spec for one Angular component, on whichever of **Playwright** or **Cypress** the project uses. This file is the shared process and the rules both platforms obey; platform-specific syntax, setup, and patterns live in the two guides:

- Cypress → [references/cypress.md](references/cypress.md)
- Playwright → [references/playwright.md](references/playwright.md)

Disclose exactly one guide per run – the one for the chosen platform.

**Detect the e2e platform before anything else**: look for `playwright.config.ts` or
`cypress.config.ts`. On the workshop's teaching branches neither exists yet – the platform
arrives later with the demo solution – while the demo branch ships Playwright (`pnpm test:e2e`).
Treat a missing platform as a real setup decision, not a side effect: get explicit user
approval before scaffolding one.

Before writing or editing tests, read `style-guide/style-guide.md` and
`style-guide/style-guide.spec.md`; if the test touches Angular template behavior or accessibility
state, also read `style-guide/style-guide.html.md` and `style-guide/style-guide.a11y.md`.

## Process

### 1. Pick the platform

Inspect the project before asking:

- Exactly one of `cypress.config.{ts,js}` / `playwright.config.{ts,js}` present (or only one of `cypress` / `@playwright/test` in `devDependencies`) → use it and **announce** the choice.
- Both present, or neither present → **ask the user** which to use.

_Done when_ the platform is fixed and stated to the user, with the reason (detected vs chosen).

### 2. Resolve the project's commands

Detect the environment so every command you emit matches it:

- **Runner**: `nx.json` present → Nx (`nx e2e <project>` / `nx run <project>:e2e`). Otherwise Angular CLI (`ng e2e`, `pnpm exec playwright test`, `pnpm exec cypress run`). Prefer an existing `package.json` script (`test:e2e`/`e2e`) over raw commands when one is present.
- **Package manager**: `pnpm-lock.yaml` → `pnpm` / `pnpm exec`; `yarn.lock` → `yarn`; otherwise `npm` / `npx`.

_Done when_ you can write the project's exact install, serve, and test-run commands.

### 3. Scaffold if missing

If the chosen platform is not yet configured, set up the minimum per the **Setup** section of the platform guide (config + support/fixtures), using the commands from step 2. Skip this step entirely when the platform is already configured.

_Done when_ the chosen platform has a config file and the spec directory exists.

### 4. Identify the component and its entry URL

Auto-discover, then confirm only when unsure:

- Read the component's `@Component({ selector })` → `COMPONENT_SELECTOR`.
- Search routes and templates for where the component renders → propose `ROUTE` (the URL to visit).
- If discovery is unambiguous and high-confidence, proceed. If the component is reachable by several routes, by none, or the selector/route is uncertain, **ask the user to confirm** `ROUTE` and `COMPONENT_SELECTOR` before writing.

_Done when_ `ROUTE` and `COMPONENT_SELECTOR` are fixed – auto-derived with confidence, or user-confirmed.

### 5. Write the spec

Follow the platform guide for syntax, file location, and naming (Cypress `<name>.cy.ts`; Playwright `<name>.spec.ts` under the e2e `testDir`). Every spec applies the [shared rules](#rules-both-guides-obey) below: open with a **self-test**, select via the **selector ladder**, assert user-facing behavior with auto-retry.

_Done when_ the spec file exists with a self-test plus at least one meaningful behavior test for the component.

### 6. Run and fix (bounded loop)

Run the **one new spec** once after checking serving ownership. The AGENTS.md approval rule also applies when a builder or Playwright webServer would start the app automatically. Reuse a user-started server by default; enable managed startup only with explicit authorization. Then loop with guardrails:

- **Cap: ~4 fix attempts.** Green at any point → done.
- **Spec-side fixes** (selectors, waiting/retry, route, setup): apply freely and re-run.
- **Infrastructure failure** (app won't build/serve, dev-server error, route 404s for an unrelated reason): stop and report – do not loop.
- **Real app/component bug** (the spec is correct and the failure points at production code): **stop and ask the user** before changing any production code. Only edit the component/app with explicit approval.
- **Integrity rule**: never weaken or delete a meaningful assertion, or replace it with a trivial one, to force a pass.

_Done when_ the spec is green, **or** the loop stops with a clear report: the failing output, your diagnosis, the reproduce command, and (if relevant) the pending decision on a production fix.

## Rules both guides obey

### Selector ladder

Pick the highest rung that works; drop down only when forced.

1. **User-facing**: role / label / text – Playwright `getByRole` / `getByLabel` / `getByText`; Cypress `cy.findByRole` / `cy.findByLabelText` (via `@testing-library/cypress`).
2. **Component host / form control**: the element tag (`app-foo`) or `[formcontrolname="x"]`.
3. **`[data-testid]`**: a documented, stable test hook – treat it as a public API, not an internal.
4. **Framework internals** (`.ng-*`, library classes): last resort only. In Cypress, hide them inside a custom command; never depend on them directly elsewhere.

Never select or assert on `_ngcontent-*` or `ng-reflect-*` – they are build-/dev-only and vanish in production.

### Self-test

Open every spec with a cheap sanity check that fails loudly when the route didn't load or the component isn't rendered. It guards against false greens from routing or build errors and makes the later assertions trustworthy. Generalize it – assert that `COMPONENT_SELECTOR` exists (optionally an expected count or a page heading); do not hardcode a showcase-app `<h1>`.

### Assertions

- Assert **observable, user-facing behavior** (text, value, visibility, ARIA state) – not implementation details.
- Lean on **auto-retry** (Playwright web-first `expect`, Cypress `.should()` chains). Never use `waitForTimeout` / `cy.wait(<ms>)`; wait for a condition instead.
- Keep tests **independent** – each test sets up what it needs and does not rely on another test's side effects or on execution order.

## Checklist

- [ ] Platform detected (or asked when both/neither) and announced
- [ ] Commands match the detected runner + package manager
- [ ] `ROUTE` + `COMPONENT_SELECTOR` derived with confidence or user-confirmed
- [ ] Spec opens with a self-test and tests real behavior
- [ ] Selectors follow the ladder; no `_ngcontent`/`ng-reflect`; no fixed waits
- [ ] Spec run; green, or stopped with a clear report (no gutted assertions, no unapproved prod edits)
