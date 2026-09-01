---
name: ng-refactor
description: Refactor a dusty / legacy Angular component into a small, modern, signal-based one using a repeatable 7-step blueprint – Analyse → Declutter → Update → Modernize → Type → Refactor → Review – while delegating Angular updates and official migration schematics to ng-migrate. Use when the user wants to refactor, modernize, clean up, tame, or "de-dust" a large, messy, or legacy Angular component, service, directive, or feature.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# ng-refactor

Over years, Angular components accumulate features, special cases, and workarounds until
responsibilities blur between UI, state, and business logic – `any` spreads, lifecycle hooks
multiply, templates fill with logic, and files cross 400, 600, 800 lines. Such "dusty"
components carry a high mental load, make every change risky, and are **harder for an AI agent
to grasp** than for a human. Clean names, small functions, and precise types reduce both
misunderstandings and hallucinations.

This skill modernizes one component (or a small set) at a time through a **repeatable
blueprint** of seven steps, each over a chosen **scope**, each verified by the full **gauntlet**
and paused at a clean **checkpoint** for human review before the next. AI accelerates the
rebuild; **the architecture decisions stay human.**

`ng-refactor` orchestrates the seven-step refactoring flow. For Angular version updates,
automatic update migrations, and official `@angular/core` migration schematics, invoke
[ng-migrate](../ng-migrate/SKILL.md) from the relevant step and let that skill own the migration
workflow.

## The blueprint – 7 steps

| #   | Step                          | What it does                                                                     |
| :-- | :---------------------------- | :------------------------------------------------------------------------------- |
| 1   | **Analyse**                   | Read the code, name the one responsibility, catalog symptoms, write a plan       |
| 2   | **Declutter** (Entschlacken)  | Delete dead code, unused members, redundant SCSS – pure subtraction              |
| 3   | **Update** (NG Update)        | Delegate Angular updates to ng-migrate so modern APIs and migrations exist       |
| 4   | **Modernize** (Modernisieren) | Delegate official schematics; replace lifecycle hooks; default OnPush + zoneless |
| 5   | **Type** (Typisierung)        | Replace `any` with explicit types – the first lever in legacy code               |
| 6   | **Refactor**                  | Split functions, extract shared logic, enforce SRP, reorder members              |
| 7   | **Review**                    | Read top-to-bottom; confirm the gains; human approves every change               |

Steps 2–6 stack: each assumes the previous ran. Declutter before you update, update before you
modernize (you need the new APIs), type before you refactor (types make the cut safe). Full
details, per-step prompts, and checklists live in [references/blueprint.md](references/blueprint.md).

## Guardrails (non-negotiable)

These hold for **every** step. They are what separate a safe refactoring from "AI slop".

- **Treat the agent like a junior.** Review every change before commit. No step is "done"
  because the agent said so – it is done when a human has read the diff.
- **No big-bang rewrite.** Only small, readable intermediate steps that can be reviewed and
  verified. Never replace a whole component in one unreadable diff.
- **Every change must earn its keep** (_Umbau-Nutzen_): each edit must deliver **less
  complexity**, **clearer responsibility**, or **modernization**. If it delivers none, don't
  make it.
- **Preserve meaning.** Do not delete existing comments or domain logic. Behavior-preserving
  refactors must not change behavior – only structure, names, and types.
- **Plan first, then implement** (the interactive prompting level: the agent proposes, you confirm, then it acts): in Step 1
  produce a plan and ask clarifying questions _before_ touching code.
- **Git discipline.** Start from a clean working tree; checkpoint after each step. **Never**
  stage, commit, or push on the user's behalf – surface the diff and let them commit.

## The gauntlet

After every step, run all four in order on the result, and do not proceed until green (on a
deliberately dusty fallback, "green" means green **or no worse than the documented red baseline**
from Step 1):

**build → lint → formatting check → test**

Resolve concrete commands from `package.json` scripts (this workspace: `pnpm build`,
`pnpm lint`, `pnpm exec prettier --check .`, `pnpm test --watch=false`). The linter is your
checklist: it enforces `max-lines: 400`, `complexity` (≤ 20 in TS – the ≤ 10 figure is the
template `cyclomatic-complexity` rule), `explicit-function-return-type`, `sort-imports`,
`prefer-const`, and the Angular best-practice rules (`prefer-signals`, `prefer-standalone`,
`prefer-on-push-component-change-detection`, `prefer-control-flow`, `prefer-self-closing-tags`, …).
`@typescript-eslint/no-explicit-any` is only **warn**-level in `eslint.config.js`, so lint stays
green with `any` left in – treat remaining `any` as a manual check, not something the gauntlet
catches. A step that is "done" but red is not done.

## Workflow

Each step is summarized to its intent and its checkable `_Done when_`; full actions, prompt
shapes, and checklists live in [references/blueprint.md](references/blueprint.md).

### 1. Analyse

Read the `.ts`, `.html`, `.scss`, and spec together without changing code. Name the single
responsibility, catalog the symptoms (LoC; lifecycle hooks; `any` / weak types; old patterns like
`*ngIf`, `@Input()`, `@Output()`, `ngClass`, `ngStyle`; template logic; duplication; unclear
names), and map the contract. Establish a behavior safety net – an e2e or characterization test
(see [create-e2e-tests](../create-e2e-tests/SKILL.md)) plus a recorded gauntlet baseline – then
write the plan and ask clarifying questions before touching code.

_Done when_ you hold a written plan, a baseline that is green or explicitly documented as red,
and a behavior safety net; the user has answered open questions. No production code changed.

### 2. Declutter (Entschlacken)

Pure subtraction, lowest risk first. Delete dead code, unused imports/members/inputs,
commented-out blocks (but **keep** meaningful comments and domain logic), and redundant SCSS.

_Done when_ only live code remains, behavior is unchanged, and the gauntlet is green.

### 3. Update (NG Update)

A workspace-level step – do it once, not per component. Delegate Angular package updates and
automatic version migrations to [ng-migrate](../ng-migrate/SKILL.md) (it owns the update command,
clean-tree preflight, migrations, gauntlet, and checkpoint); bring non-Angular packages along when
the plan needs them, and address security (CSP, Trusted Types, 3rd-party packages) while versions
move. Cadence and the automatic-migration list:
[references/modern-angular.md](references/modern-angular.md#updates--security).

_Done when_ Angular is current, automatic migrations have run, and the gauntlet is green.

### 4. Modernize (Modernisieren)

Delegate the official schematics to [ng-migrate](../ng-migrate/SKILL.md) – one migration per
checkpoint (standalone, control flow, `inject()`, signal `input()`/`output()`/queries,
self-closing tags, `ngClass`/`ngStyle` → bindings, lazy routes, unused-import cleanup) – then do
the modernization the schematics don't cover. **Replace lifecycle hooks** (prefer none at all):
move setup into field initializers / the `constructor`, use `takeUntilDestroyed()` for manual
subscriptions, and reach for `effect()` / `afterNextRender()` / `afterEveryRender()` /
`afterRenderEffect()` instead of `ngAfterViewInit` / `ngOnChanges`.

Rely on the **default OnPush + zoneless** (v22+: drop explicit `changeDetection:` settings and any Zone.js remnants), prefer `computed()` over manually-maintained derived state and
signal-based binding (`input`/`output`/`model`); `SignalStore` only if you truly need it (gate and
patterns in [ng-signal-store](../ng-signal-store/SKILL.md)), Signal Forms via
[ng-forms](../ng-forms/SKILL.md).

Mapping table and rule-by-rule guidance: [references/modern-angular.md](references/modern-angular.md).

_Done when_ the chosen migrations are applied (each gauntlet-green and checkpointed), no
lifecycle hooks remain that signals/render hooks can replace, and the component carries no explicit `changeDetection` (default OnPush).

### 5. Type (Typisierung)

Strict typing is **the first lever** in legacy code: give every return and parameter type an
explicit type ("everything has a type"), prefer `unknown` over `any` and `type` over `interface`,
and extract small, precisely-named types – each non-trivial one in its own file (_Rule of One_) –
so typed in-/outputs make the component readable.

_Done when_ no `any` remains and `explicit-function-return-type` is clean (`no-explicit-any` is
only warn-level, so confirm the remaining `any` by hand), and the gauntlet is green.

### 6. Refactor

The structural work in small reviewable diffs: shrink big event handlers into small,
intent-revealing functions (`buildRequest`, `validateInput`, `updateSelection`); lift shared logic
into services/directives/pipes/utils (DRY); split oversized components under SRP + Rule of One
(each in its own file, ≤ ~400 LoC); reorder members to the canonical structure; thin the template
by moving logic into `computed()`/methods (template cyclomatic complexity ≤ 10); prefer `private`,
`readonly`, `const`. Member ordering, naming, and extraction patterns:
[references/clean-code-and-structure.md](references/clean-code-and-structure.md).

_Done when_ each unit has one responsibility, no file exceeds ~400 LoC, functions are small and
named, the template is logic-light, and every diff was gauntlet-green and checkpointed.

### 7. Review

Read the result top-to-bottom as if onboarding fresh: confirm one clear responsibility and
canonical member order, no `any`, small named functions, no file > ~400 LoC, no explicit `changeDetection` (default OnPush), no leftover
lifecycle hooks, intact comments and domain logic, and tests that are still green **and still
meaningful** – every change earning a real gain. Summarize what changed and **why** (the
_Umbau-Nutzen_) and list follow-ups. The general review practice (scopes, two passes, verifying
findings) lives in the [code-review](../code-review/SKILL.md) skill; run [code-review](../code-review/SKILL.md) for an independent
reviewer, or hand a large scope to [ng-review-architecture](../ng-review-architecture/SKILL.md).
The **human approves every change before commit** – this skill never commits for you.

_Done when_ the human has reviewed the full diff, the gauntlet is green, and the gains are
written down.

## Setup this skill assumes

The workshop's guardrails make AI refactoring reproducible – they should already be in place
(see [Lab 01](https://github.com/L-X-T/ng-agentic/blob/skills/labs/01-setup.html)): **Prettier** + **ESLint** (the shared quality
frame), an **`AGENTS.md`** with the project's rules, the **Angular MCP** for current docs, and
per-tool secret-deny rules (`.claude/settings.json`, `.codex/config.toml`) so the agent never reads what it shouldn't. If they're missing, set them up
first – the gauntlet and the linter-as-checklist depend on them.

## Pairs with

- [ng-migrate](../ng-migrate/SKILL.md) – owns Angular package updates, automatic update
  migrations, and official `@angular/core` migration schematics for Steps 3 and 4.
- [ng-review-architecture](../ng-review-architecture/SKILL.md) – deeper review in Steps 1 & 7.
- [ng-forms](../ng-forms/SKILL.md) · [ng-security](../ng-security/SKILL.md) ·
  [ng-performance](../ng-performance/SKILL.md) · [ng-accessibility](../ng-accessibility/SKILL.md)
  – focused passes when a refactoring touches forms, security, performance, or a11y.
- [create-e2e-tests](../create-e2e-tests/SKILL.md) – build the safety net in Step 1.

## Verification contract

Use the repository VERIFICATION.md when present. Run checks independently on the final files so a known-red baseline cannot suppress later results. Autofix and formatting writes belong to implementation; reverify after them. Compare exact baseline diagnostics and run the relevant behavior tests explicitly.
