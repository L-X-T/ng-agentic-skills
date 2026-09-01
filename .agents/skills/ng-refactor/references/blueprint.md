# The refactoring blueprint – 7 steps in detail

The repeatable strategy for de-dusting an Angular component with AI. Run the steps in order;
each assumes the previous one ran and left the tree green. Every step ends with the **gauntlet**
(build → lint → formatting check → test) and a **checkpoint** the human reviews and commits.
This blueprint is orchestrated by `ng-refactor`; Angular updates and official migration
schematics are delegated to [ng-migrate](../../ng-migrate/SKILL.md).

> **The prompting order.** A good prompt starts with an observation, a goal, and constraints,
> then states scope (which file, which context, desired output) and the check (ESLint-clean,
> tests pass). Run it in two beats: **(1) plan and ask clarifying questions, then (2) implement.**
> Never let an agent jump straight to a rewrite. Climb the prompting progression instead – simple
> prompt, interactive (propose, confirm, act), grilling (see [grill-me](../../grill-me/SKILL.md)).

---

## 1. Analyse

**Goal:** understand the component and write a plan – change nothing yet.

**Actions**

- Read the `.ts`, `.html`, `.scss`, and `.spec` together. Get the whole picture before judging.
- State the **single responsibility** the component should have. Everything not serving it is a
  candidate to extract (Step 6) or delete (Step 2).
- Catalog symptoms (these become the to-do list):
  - Size – total LoC; anything over ~400 is a smell.
  - Lifecycle hooks (`ngOnInit`, `ngOnChanges`, `ngAfterViewInit`, …) and hard-to-trace side effects.
  - Typing – `any`, missing return/parameter types, fuzzy shapes.
  - Old patterns – `*ngIf` / `*ngFor` / `*ngSwitch`, `@Input()` / `@Output()`, `ngClass` / `ngStyle`.
  - Template logic – expressions doing real work in `.html`.
  - Duplication – repeated blocks that want a service / pipe / util.
  - Naming – abbreviations and unclear symbols (`x`, `sel`, `data`).
- Map the **contract**: inputs, outputs, injected services, template bindings, public methods.
- Establish a **safety net** – refactoring without tests is gambling. Prefer an e2e test of the
  observable behavior (see [create-e2e-tests](../../create-e2e-tests/SKILL.md)); add a
  characterization test if coverage is thin. Run the gauntlet and record the baseline – green, or
  explicitly documented as red on a deliberately dusty target.

**Prompt shape**

> "Here is `foo.component.ts` (+ html/scss). Its job is X. Analyse it, list the smells (size,
> lifecycle hooks, `any`, old patterns, template logic, duplication, naming), and propose an
> ordered refactoring plan following the 7-step blueprint. **Ask me clarifying questions first –
> don't change any code yet.**"

**Exit check:** a written plan + answered questions + a recorded baseline (green, or explicitly
documented as red) + behavior safety net. No production code changed.

---

## 2. Declutter (Entschlacken)

**Goal:** remove everything dead – pure subtraction, lowest risk.

**Actions**

- Delete dead code, unreachable branches, unused imports, unused inputs/outputs/fields/methods.
- Remove commented-out code blocks – **but keep meaningful comments and domain logic.**
- Drop redundant / duplicated SCSS.

**Exit check:** only live code remains; behavior unchanged; gauntlet green. A small, obviously
safe diff.

---

## 3. Update (NG Update)

**Goal:** make the modern toolbox available. A **workspace-level** step – run once, not per
component.

**Actions**

- Invoke [ng-migrate](../../ng-migrate/SKILL.md) for Angular package updates and automatic version
  migrations. That skill owns the update command, clean-tree preflight, gauntlet, and checkpoint.
- Bring other npm packages up too when the refactoring plan requires it – but that alone is not
  enough; the manual modernization in
  Step 4 is where most of the value is.
- Handle security while you're moving versions: CSP policies, Trusted Types, and especially
  3rd-party packages. See [modern-angular.md](modern-angular.md#updates--security).

**Exit check:** Angular is current, automatic migrations applied and reviewed, gauntlet green.

---

## 4. Modernize (Modernisieren)

**Goal:** adopt modern Angular APIs and idioms.

**Actions – official schematics (delegate to [ng-migrate](../../ng-migrate/SKILL.md)), one per checkpoint**

- standalone · control flow (`@if` / `@for` / `@switch`) · `inject()` · signal `input()` /
  `output()` / queries · self-closing tags · `ngClass` / `ngStyle` → bindings · lazy routes with
  `loadComponent` · final unused-import cleanup.

**Actions – what the schematics don't do**

- **Replace lifecycle hooks.** Prefer no hook at all. Move setup into field initializers / the
  `constructor`; use `takeUntilDestroyed()` for manual subscriptions; use `effect()`,
  `afterNextRender()`, `afterEveryRender()`, `afterRenderEffect()` instead of
  `ngAfterViewInit` / `ngOnChanges`.
- **OnPush + zoneless.** Switch change detection to `OnPush`.
- **Reactivity.** `computed()` for derived state (replace manually-synced fields and many
  `BehaviorSubject`s); `input` / `output` / `model` for data binding; `SignalStore` only if you
  genuinely need shared state; Signal Forms via [ng-forms](../../ng-forms/SKILL.md).

Full mapping and rule-by-rule notes: [modern-angular.md](modern-angular.md).

**Exit check:** chosen migrations applied (each gauntlet-green + checkpointed); no replaceable
lifecycle hooks remain; component is OnPush.

---

## 5. Type (Typisierung)

**Goal:** turn types into a safety net – the **first lever** in legacy code.

**Actions**

- Replace fuzzy types with explicit ones: every **return type** and **parameter type**.
- Prefer `unknown` over `any`; prefer `type` over `interface`.
- Extract small, precisely-named types; put each non-trivial one in its own file.
- Precisely name and type inputs/outputs – it makes the component self-explanatory.

**Exit check:** no `any`; `explicit-function-return-type` clean; gauntlet green.
(`@typescript-eslint/no-explicit-any` is only warn-level in `eslint.config.js`, so lint stays green
with `any` left in – treat remaining `any` as a manual check, not a gauntlet gate.)

---

## 6. Refactor

**Goal:** the real structural work – in small, reviewable diffs.

**Actions**

- **Shrink functions.** A large event handler usually mixes validation, mapping, state update,
  and UI side effects. Describe the flow, then cut into small intent-revealing functions
  (`buildRequest`, `validateInput`, `updateSelection`). AI is strong here when it describes the
  steps first and only then slices.
- **DRY.** Move shared logic into services, directives, pipes, utils, or sub-components.
- **SRP + Rule of One.** Split an oversized component into smaller focused ones; each thing gets
  its own file; keep each ≤ ~400 LoC.
- **Reorder members** to the canonical structure; keep the class readable top-to-bottom.
- **Thin the template.** Push logic into `computed()` / methods; respect cyclomatic complexity ≤ 10.
- Prefer `private`, `readonly`, `const`.

See [clean-code-and-structure.md](clean-code-and-structure.md) for ordering, naming, and patterns.

**Exit check:** one responsibility per unit; no file > ~400 LoC; small named functions; thin
template; each diff gauntlet-green + checkpointed.

---

## 7. Review

**Goal:** confirm the gains and hand the result to a human.

**Checklist**

- Reads top-to-bottom; one clear responsibility; canonical member order.
- No `any`; small named functions; no file > ~400 LoC; OnPush; no leftover lifecycle hooks.
- Comments and domain logic intact; tests green **and still meaningful** (not asserting internals).
- Each change delivered a real gain – **less complexity, clearer responsibility, or modern**.

Write a short summary: what changed, **why** (the _Umbau-Nutzen_), and remaining follow-ups. The
general review practice (scopes, two passes, verifying findings) lives in the
[code-review](../../code-review/SKILL.md) skill, which dispatches an independent
reviewer. For a large scope, hand off to
[ng-review-architecture](../../ng-review-architecture/SKILL.md).

**The human reviews and commits every change.** This skill never commits for you.

---

## Worked example

The workshop refactors a deliberately dusty component end-to-end through these seven steps:
[ng-days-refactoring-ai](https://github.com/L-X-T/ng-days-refactoring-ai).
