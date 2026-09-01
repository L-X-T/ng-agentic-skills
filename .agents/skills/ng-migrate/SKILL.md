---
name: ng-migrate
description: Run Angular package updates and official `ng generate @angular/core:*` migration schematics to modernize Angular code – standalone, control flow, `inject()`, signal inputs/outputs/queries, lazy routes, self-closing tags, ngClass/ngStyle, CommonModule, RouterTestingModule, unused-import cleanup. Use when the user wants to update Angular, run `ng update`, migrate, modernize, or convert Angular code at any scope from a single component or service up to a library or whole application.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# ng-migrate

Angular ships official **migration** workflows that rewrite code deterministically. This skill owns
both Angular version updates (this repo's `pnpm ng:update` script, wrapping `ng update`) and opt-in
`ng generate @angular/core:*` modernization schematics.

For modernization schematics, run one migration at a time, each over a chosen **scope**, each
verified by the full **gauntlet** and committed at a clean **checkpoint** before the next. Prefer
these schematics over hand-editing – they update every reference (templates, tests, call sites)
that a manual edit would miss.

For Angular package updates and their automatic version migrations, follow
[references/ng-update-migrations.md](references/ng-update-migrations.md). The same clean-tree
preflight, gauntlet, and checkpoint discipline applies.

## Hard rule: planned migrations are not optional

If a migration was selected by the user or written into an approved plan, do not silently skip it,
revert it, or report the task complete with the old pattern still present. A failing schematic or
red gauntlet means the migration is **incomplete**, not deselected.

When a selected migration cannot be completed mechanically:

- Fix forward in the same migration checkpoint when the required work is local and clear.
- Stop with a blocker when the required work is broader than the approved scope.
- Only de-scope the migration after explicit user approval, and record the reason in the report.

Before reporting success, search the target scope for the legacy pattern the migration was meant to
remove. For signal migrations, that means no remaining `@Input()`, `@Output()`, `@ViewChild`,
`@ViewChildren`, `@ContentChild`, or `@ContentChildren` in the approved scope unless the user
explicitly approved an exception.

## Workflow

Use this workflow for opt-in modernization schematics. For Angular version updates, use
[references/ng-update-migrations.md](references/ng-update-migrations.md) after the same preflight.

### 1. Preflight

- Confirm the working tree is clean (`git status`). If it is not, **stop** and ask the user to commit or stash first – migrations touch many files and must start from a clean **checkpoint**. Never stage or commit on the user's behalf.
- Detect the toolchain: Angular major version (`pnpm exec ng version`, or `@angular/core` in `package.json`) and the package manager (from the lockfile – `pnpm-lock.yaml` ⇒ `pnpm`).
- Resolve the four **gauntlet** commands from `package.json` scripts / `angular.json`, with CLI fallbacks: build (`ng build`), lint (`ng lint`), format check (`prettier --check .`), test (`ng test --watch=false`).

_Done when_ the tree is clean and you hold concrete build, lint, format, and test commands.

### 2. Scope

Ask the user which **scope** this run targets – never assume – then resolve it to flags:

| Scope                                                       | Flag                                                                                                            |
| :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| Single building block (one component / service / directive) | `--path <file-or-its-folder>`                                                                                   |
| Library or app in a multi-project workspace                 | `--path <project src dir>` (e.g. `projects/my-lib/src`); add `--project <name>` where the schematic supports it |
| Whole workspace / single-app repo                           | `--path ./` (or omit)                                                                                           |

`--path` is relative to the project root, accepts a file or a directory, and is the one scoping flag every migration declares – prefer it. Exception: `cleanup-unused-imports` exposes no `--path` and always runs project-wide.

_Done when_ scope is a concrete `--path` / `--project` (or deliberately none), confirmed by the user.

### 3. Select migrations

Show the [catalog](#migration-catalog) below, filtered to what the scope plausibly contains. The user ticks which to run; default to all that apply. **Keep the catalog order** – later migrations assume earlier ones ran, and `cleanup-unused-imports` must come last so it sweeps imports the others leave dangling.

_Done when_ you have an ordered list of chosen migrations.

### 4. Run – one migration per loop

For each chosen migration, in catalog order:

1. **Apply** – run `pnpm exec ng generate @angular/core:<name> <scope-flags> [options]`. For **standalone**, run its three `--mode` phases as three separate loop iterations (see catalog note). Answer any interactive schematic prompt per the catalog.
2. **Residual-pattern check** – immediately search the scope for the pattern this migration should remove. If it remains, read the schematic output and TODOs, then either fix forward or stop with the exact unmigrated sites.
3. **Gauntlet** – run all four, in order, on the result: **build → lint → formatting check → test**. This is the per-step bar the user chose; do not weaken it.
4. **Green or stop** – if any gauntlet stage fails, surface the exact error and either fix forward or tell the user how to revert (`git restore .`). Do **not** start the next migration until the gauntlet is green. Never discard the user's changes for them.
5. **Checkpoint** – present the diff summary plus the residual-pattern check and gauntlet result, then pause for the user to review and commit. Wait for their go-ahead before the next migration.

_Done when_ every chosen migration has been applied, has passed the full gauntlet, and has been checkpointed by the user – none skipped silently.

### 4a. Signal migration recovery loop

Signal inputs and signal queries are often coupled to lifecycle code. If `signal-input` or
`signal-queries` makes build, lint, or e2e fail, do not revert the migration and continue with
legacy decorators. Complete the required paired modernization in the same checkpoint.

For `signal-input` failures:

- Replace `ngOnChanges` reactions with `computed()` or `effect()` over `input()` values.
- Preserve previous-value behavior explicitly when the old `SimpleChanges` logic depended on it.
- Use `input.required<T>()` only when the old input was truly required at runtime.
- Update all class and template reads from property access to signal invocation.
- Run with `--analysisDir ./` when call sites outside `--path` may reference the inputs.

For `signal-queries` failures:

- Replace query field reads with signal reads and guard absent values before first render.
- Move DOM/query-dependent work from lifecycle hooks to `afterNextRender()`,
  `afterEveryRender()`, or `afterRenderEffect()` as appropriate.
- Preserve imperative third-party component contracts by calling their APIs from guarded effects.
- Keep `--insertTodos` enabled when diagnosing un-migratable sites, then resolve or report every
  TODO before completion.

For components that combine signal inputs, query signals, and imperative widget APIs, migrate in
this order inside the same modernization checkpoint when needed: inputs, lifecycle reactions,
queries, render-hook effects, then outputs. The checkpoint is not complete until behavior tests
covering the widget still pass.

### 5. Report

Summarize: migrations run (with their commits), any deselected, any `// TODO` markers left behind by `--insertTodos`, and manual follow-ups the schematics flagged as un-migratable.

## Migration catalog

Run top-to-bottom; `cleanup-unused-imports` is always last. Commands use the short alias; canonical names, flags, and gotchas are in [references/migration-details.md](references/migration-details.md).

| #   | Modernizes                                                    | Command (`ng g @angular/core:…`)                                                            |
| :-- | :------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| 1   | NgModules → standalone (3 phases)                             | `standalone --mode convert-to-standalone` → `… prune-ng-modules` → `… standalone-bootstrap` |
| 2   | `CommonModule` → individual imports                           | `common-to-standalone`                                                                      |
| 3   | `*ngIf` / `*ngFor` / `*ngSwitch` → `@if` / `@for` / `@switch` | `control-flow`                                                                              |
| 4   | Verbose tags → self-closing tags                              | `self-closing-tag`                                                                          |
| 5   | `ngClass` → `class` bindings                                  | `ngclass-to-class`                                                                          |
| 6   | `ngStyle` → `style` bindings                                  | `ngstyle-to-style`                                                                          |
| 7   | Constructor DI → `inject()`                                   | `inject`                                                                                    |
| 8   | `@Input()` → signal `input()`                                 | `signal-input`                                                                              |
| 9   | `@ViewChild` / `@ContentChild` → signal queries               | `signal-queries`                                                                            |
| 10  | `@Output()` → `output()`                                      | `outputs`                                                                                   |
| 11  | Eager routes → lazy `loadComponent`                           | `route-lazy-loading`                                                                        |
| 12  | `RouterTestingModule` → `provideRouter()`                     | `router-testing-module-migration`                                                           |
| 13  | Remove unused standalone imports (project-wide)               | `cleanup-unused-imports`                                                                    |

**Standalone is three phases**, each its own loop iteration with its own gauntlet + checkpoint: `convert-to-standalone` → verify → `prune-ng-modules` → verify → `standalone-bootstrap` → verify.

**Signals shortcut**: `ng g @angular/core:signals` runs #8–#10 in one pass. This skill runs them individually so each gets its own gauntlet and checkpoint; offer the combined form only if the user wants one commit for all three.

For migrations that run automatically on a version bump (`ng update`, e.g. `change-detection-eager`, `http-xhr-backend`), see [references/ng-update-migrations.md](references/ng-update-migrations.md).

## Verification contract

Use the repository VERIFICATION.md when present. Run checks independently on the final files so a known-red baseline cannot suppress later results. Autofix and formatting writes belong to implementation; reverify after them. Compare exact baseline diagnostics and run the relevant behavior tests explicitly.
