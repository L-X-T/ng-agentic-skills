---
name: ng-styling
description: 'Audit Angular styling against the repo style guide, the "Angular Styling" workshop deck, and angular.dev, then fix findings on approval. Use when reviewing, checking, or cleaning up Angular styling / CSS / SCSS: prefer `[class.x]` / `[style.x]` over `ngClass` / `ngStyle`, View Encapsulation (Emulated / ShadowDom / None), (S)CSS architecture, design tokens via CSS custom properties and `:host` knobs, BEM with a project prefix, nesting depth, and removing `!important`, `::ng-deep`, `float`, inline styles, and leaked framework classes (ag-grid `.ag-*`, ng-select `.ng-*`, spartan). Also advises on SSR-safe DOM access, NG17 view transitions, design systems, Tailwind, and Stylelint. Produces a provenance-tagged, severity-ranked report before changing anything; fixes on approval in verified batches and never commits.'
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# ng-styling

Styling rot is different from logic rot. CSS has no type system: the compiler won't catch a
leaked framework class, an `!important` arms race, a raw hex color that should have been a design
token, or a `::ng-deep` reaching into a child component. Specificity creep and global leakage make
every visual change risky and the styling layer **hard for an AI agent to reason about** – the same
way `any` makes TypeScript hard. Scoped styles, design tokens, shallow selectors, and a clear
global-vs-component split keep the CSS small, predictable, and safe to change.

This skill **audits the styling of an Angular project against three sources of truth**, writes a
**provenance-tagged, severity-ranked report**, and – only on your approval – fixes findings in
small, verified, checkpointed batches. The audit is the default; fixing is opt-in. Because styling
changes can change what the user _sees_, the bar here is **appearance-preserving**, not merely
behavior-preserving: every fix that can shift specificity or layout must be eyeballed.

## Three sources of truth (cited on every finding)

Each finding carries the source(s) that back it, so you can trust and trace it:

| Tag             | Source                                                                                                                                                                                                                                                                                             |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[repo]`        | This project's written style guide – [`style-guide.scss.md`](../../../style-guide/style-guide.scss.md), the styling rules in [`style-guide.html.md`](../../../style-guide/style-guide.html.md), and the styling-relevant TS rules in [`style-guide.ts.md`](../../../style-guide/style-guide.ts.md) |
| `[deck]`        | The workshop deck _"Angular Styling"_ (the topics, framing, and "Best Practices/Tips" recap)                                                                                                                                                                                                       |
| `[angular.dev]` | The official [Angular coding style guide](https://angular.dev/style-guide) and the [Styling components](https://angular.dev/guide/components/styling) / [view transitions](https://angular.dev/guide/routing/route-transition-animations) guides                                                   |

The `[repo]` guide is the project's law and the most specific; `[angular.dev]` is the upstream
backstop (it is deliberately thin on CSS – strong on the binding rule, encapsulation, file naming,
and view transitions); the `[deck]` supplies topics the written guide under-emphasizes (encapsulation
trade-offs, view transitions, component frameworks, design systems, `inject(DOCUMENT)`).

Note: the deck itself is **not loadable in-context**, so where a `[deck]` rule also has an official
page – notably **view transitions** and **View Encapsulation** – prefer `[angular.dev]` (plus
`[repo]`) as the citable, verifiable backing.

## What it audits

**Core** – pass/fail against rules. Full catalog with detection and fixes in
[references/styling-checklist.md](references/styling-checklist.md).

| #   | Category                      | Gist                                                                                                                                                                                      | Sources                           |
| :-- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| 1   | **Template bindings**         | `[class.x]` / `[style.x]` over `ngClass` / `ngStyle`; inline styles only when computed/dynamic                                                                                            | `[repo]` `[deck]` `[angular.dev]` |
| 2   | **View Encapsulation**        | `Emulated` is the default; `None` demands a project prefix; ShadowDom trade-offs                                                                                                          | `[repo]` `[deck]` `[angular.dev]` |
| 3   | **SCSS architecture & files** | Component-scoped vs global split; `@use` / `@forward` not `@import`; partials & layer order; co-located, same-name, kebab-case style files                                                | `[repo]` `[deck]` `[angular.dev]` |
| 4   | **Design tokens**             | Global CSS custom properties for tokens; `:host` for component knobs; no raw colors in components                                                                                         | `[repo]` `[deck]`                 |
| 5   | **Selectors & nesting**       | Classes/elements not ids; BEM with the project prefix; ≤ 2 (rarely 3) nesting; no `&` nesting                                                                                             | `[repo]`                          |
| 6   | **Forbidden constructs**      | No `!important`, `::ng-deep`, `float`, inline styles, or reused library classes                                                                                                           | `[repo]` `[deck]`                 |
| 7   | **Units & values**            | `rem` for type; unitless `0`; leading `0`; shorthand/intrinsic; logical properties; `:has()`                                                                                              | `[repo]`                          |
| 8   | **Framework-class leakage**   | Don't bind installed frameworks' classes directly (ag-grid `.ag-*`, ng-select `.ng-*`, spartan; Material/PrimeNG as a generic aside); prefix; customize via each framework's theming vars | `[repo]` `[deck]`                 |

**Advisory** – opportunities, _not_ violations. Reported separately; never auto-applied. Detail in
[references/component-frameworks.md](references/component-frameworks.md).

- **`inject(DOCUMENT)`** for SSR-safe `document` access (scroll, body class). The _write_ side
  (sanitization, raw DOM) defers to [`ng-security`](../ng-security/SKILL.md). `[deck]`
- **View transitions** – `provideRouter(routes, withViewTransitions())`; transition CSS
  (`::view-transition-old/new`, `view-transition-name`) **must live in global styles**, since
  encapsulation would scope it away. `[deck]` `[angular.dev]`
- **Design systems & frameworks** – **detect the Tailwind v4 setup first**: look for
  `src/tailwind.scss`, `.postcssrc.json`, and oklch tokens in `src/styles.scss` (the workshop's
  teaching branches don't have it yet; the demo branch does). While it's absent, treat Tailwind
  as to-be-configured and report adoption as the opportunity; once wired, **audit the existing
  usage**: check `@layer` order and the token-vs-utility split (design
  decisions live in CSS custom properties; utilities carry layout/spacing), and flag utilities that
  should have been a token. Plus the Material CDK for a11y, Storybook, Standalone + OnPush, and
  `ViewEncapsulation.None` for a design-system library (`[angular.dev]`); and **consider adding
  Stylelint** to make the mechanical rules deterministically enforceable. `[deck]`

## Severity (mirrors the style guide)

| Severity        | Means                                          | Maps to                                           |
| :-------------- | :--------------------------------------------- | :------------------------------------------------ |
| 🔴 **Must**     | A violation – fix it                           | the guide's **"Must do" / "Don't"**               |
| 🟡 **Should**   | A strong recommendation – fix unless justified | the guide's **"Should do"**                       |
| 🔵 **Advisory** | An opportunity to consider                     | the deck's adoption topics & "consider Stylelint" |

## Enforcement: tool-agnostic reasoning

This skill adds **no tooling dependency**. It reasons against the three sources using only what the
project already has – **Prettier** (SCSS formatting) and **ESLint** (template binding & a11y rules).
It does **not** require or install Stylelint; "add Stylelint" is an _advisory_ finding only. The
consequence: most SCSS-architecture rules are caught by reading and reasoning, not by a linter – so
the report is the checklist, and the reference catalog tells you exactly what to look for.

## Workflow

### 1. Inventory & scope

Default scope is the whole project; accept a narrower scope (a path, a component, a feature, or
"global styles only"). Inventory:

- every `*.scss` (component styles, `src/styles.scss`, `src/styles/` partials),
- inline `styles`/`styleUrl(s)` and `encapsulation` in `@Component` decorators,
- templates with `ngClass` / `ngStyle` / `[class.*]` / `[style.*]` / `style="…"`,
- global vs component placement, and any component-framework usage (ag-grid, ng-select, spartan;
  Material/PrimeNG only if present).

### 2. Audit

Walk each of the 8 core categories against [references/styling-checklist.md](references/styling-checklist.md);
collect advisory opportunities separately. For each finding record: **severity · rule id · sources ·
`file:line` · what's wrong · suggested fix · fixable = auto | proposed**.

### 3. Report

Write a grouped markdown report to **`styling-audit.md`** at the project root (path overridable),
and render the same grouped summary in chat. Group by category; lead with 🔴 Must, then 🟡 Should,
then 🔵 Advisory; end with counts and a suggested fix order. **The run stops here unless you ask for
fixes.**

### 4. Fix on approval

Only after you say go. Apply in small batches, each batch one coherent kind of change:

- **Mechanical (auto-applied per batch):** `ngClass` → `[class.x]`, `ngStyle` → `[style.x]`,
  `@import` → `@use`/`@forward`, unitless `0`, leading `0`, shorthand – i.e.
  the unambiguous, low-risk rewrites.
- **Judgment-heavy (proposed as diffs, you decide):** changing `encapsulation`, extracting design
  tokens, removing `!important` / `::ng-deep` (specificity risk), un-leaking framework classes,
  flattening deep nesting, restructuring global vs component styles.

Verify and **checkpoint after every batch** (see the gauntlet). Never stage, commit, or push.

### 5. Verify & review

Run the gauntlet on each batch and read the diff top-to-bottom. Confirm each change earned its keep
(less complexity / clearer responsibility / closer to the guide) and that **appearance is
preserved** – for any specificity- or layout-affecting change, verify visually. Re-audit the touched
scope; the report should now be green there.

## The gauntlet

After every fix batch, run in order and don't proceed until green:

**build → lint → formatting check → test (if templates changed) → visual check (if appearance could shift)**

Resolve commands from `package.json` (here: `pnpm build`, `pnpm lint` / `ng lint`,
`pnpm exec prettier --check .`, `pnpm test --watch=false`). `build` catches SCSS compile errors and the `anyComponentStyle` budget;
`lint` covers the template-binding rewrites; `format` is Prettier on SCSS. The **visual check** is
unique to styling: unlike a behavior-preserving TS refactor, removing `!important`, changing
encapsulation, or flattening selectors can change what renders.

## Guardrails (non-negotiable)

- **Appearance-preserving, not just behavior-preserving.** CSS changes can alter the rendered
  result. Treat specificity/layout-affecting fixes as risky; verify visually; never bundle them
  blindly. Color-contrast and focus-visibility belong to [`ng-accessibility`](../ng-accessibility/SKILL.md).
- **Audit first; fixing is opt-in.** A run is read-only until you approve fixes.
- **Treat the agent like a junior.** A human reviews every diff before commit. "Done" means the
  diff was read, not that the agent said so.
- **No big-bang restyle.** Small, reviewable, single-purpose batches – never a sweeping CSS rewrite.
- **Every change earns its keep.** Each edit must deliver less complexity, clearer responsibility,
  or closer conformance. A "fix" with no benefit isn't one.
- **Preserve meaning.** Keep meaningful comments and documented hacks/workarounds (the guide asks
  you to _document_ complex CSS, not delete it). Don't change selectors that other code depends on
  without tracing usage.
- **Advisory ≠ violation.** Never auto-apply advisory items; present them and let the human choose.
- **Git discipline.** Start from a clean working tree; checkpoint after each batch. **Never** stage,
  commit, or push – surface the diff and let the human commit.

## Setup this skill assumes

The workshop's quality frame should already be in place (see [Lab 01](https://github.com/L-X-T/ng-agentic/blob/skills/labs/01-setup.html)):
**Prettier** + **ESLint**, an **`AGENTS.md`** with the project rules, the project's
[`style-guide/`](../../../style-guide/style-guide.md), the **Angular MCP** for current docs, and
per-tool secret-deny rules (`.claude/settings.json`, `.codex/config.toml`). **Stylelint is optional** – if absent, the skill reports it as a 🔵 advisory rather
than relying on it.

## Pairs with

- [`ng-migrate`](../ng-migrate/SKILL.md) – its **Modernize** step already migrates
  `ngClass`/`ngStyle` → bindings; run ng-styling for the SCSS-architecture and token work it doesn't
  cover.
- [`ng-accessibility`](../ng-accessibility/SKILL.md) – color contrast, focus rings, reduced-motion
  for view transitions.
- [`ng-performance`](../ng-performance/SKILL.md) – the `anyComponentStyle` budget, critical CSS,
  framework-CSS weight.
- [`ng-security`](../ng-security/SKILL.md) – inline styles as a CSP concern; the _write_ side of
  `document` access.
- [`ng-review-architecture`](../ng-review-architecture/SKILL.md) – deeper structural review when a
  restyle turns into a design-system decision.
- [`spartan`](../spartan/SKILL.md) – when styling is built on spartan/ui (Helm) instead of a heavy
  component framework.

## Detailed references

- [references/styling-checklist.md](references/styling-checklist.md) – the full, provenance-tagged
  rule catalog: every rule with its id, severity, sources, how to detect it, the fix, and whether
  it's auto- or proposed-fixable.
- [references/scss-architecture.md](references/scss-architecture.md) – global vs component split,
  the global-styles layer order, `@use`/`@forward` migration, design tokens vs `:host` knobs, the
  View Encapsulation decision guide, specificity & nesting, logical properties, and where view-
  transition CSS must live.
- [references/component-frameworks.md](references/component-frameworks.md) – the heavy-CSS
  frameworks to detect in `package.json` (ag-grid `.ag-*`, ng-select `.ng-*`, spartan; Material/PrimeNG
  as a generic aside) and how to customize without leaking their classes,
  design-system best practices, the `inject(DOCUMENT)` advisory, and "consider Stylelint".

## Origin

Authored in this repository from Alexander Thalhammer's workshop deck _"Angular Styling"_, this
project's style guide, and the official Angular style guide. MIT-licensed.

## Verification contract

Use the repository VERIFICATION.md when present. Run checks independently on the final files so a known-red baseline cannot suppress later results. Autofix and formatting writes belong to implementation; reverify after them. Compare exact baseline diagnostics and run the relevant behavior tests explicitly.
