# Migration details

Per-migration canonical name, aliases, flags, prompts, and gotchas for the 13 modernization schematics. Defaults reflect Angular v22; confirm against the installed version with `ng generate @angular/core:<name> --help`.

## Common to all

- **Scope with `--path`** (relative to the project root; accepts a file or directory). It is declared on every migration except `cleanup-unused-imports`.
- **Multi-project workspaces**: point `--path` at the project's source folder (e.g. `--path projects/my-lib/src`). Some migrations also honour `--project <name>` – verify with `--help`.
- **Non-interactive runs**: pass `--interactive=false` and supply each flag explicitly instead of answering prompts.
- **Discover everything**: `ng generate @angular/core: --help` lists schematics; `ng generate @angular/core:<name> --help` lists that one's flags.

---

## 1. standalone

`@angular/core:standalone-migration` (alias `standalone`) – converts NgModule-based code to standalone.

| Flag     | Default                 | Purpose                                                                    |
| :------- | :---------------------- | :------------------------------------------------------------------------- |
| `--mode` | `convert-to-standalone` | One of `convert-to-standalone`, `prune-ng-modules`, `standalone-bootstrap` |
| `--path` | `./`                    | Directory to migrate                                                       |

**Three-phase workflow – run as three separate steps, verifying (gauntlet) between each:**

1. `--mode convert-to-standalone` – marks components/directives/pipes standalone and fills their `imports`.
2. `--mode prune-ng-modules` – deletes the now-empty NgModules.
3. `--mode standalone-bootstrap` – switches `main.ts` to `bootstrapApplication`.

Phase 2 only succeeds once phase 1's build is green. If the app still has a root `AppModule` you intend to keep temporarily, stop after phase 1.

---

## 2. common-to-standalone

`@angular/core:common-to-standalone-migration` (alias `common-to-standalone`) – replaces `CommonModule` in a standalone component's `imports` with the specific directives/pipes it uses (`NgIf`, `NgForOf`, `AsyncPipe`, …).

| Flag     | Default | Purpose              |
| :------- | :------ | :------------------- |
| `--path` | `./`    | Directory to migrate |

Run **after** `standalone` (needs `imports` arrays). Running it before `control-flow` is fine – `control-flow` later removes `*ngIf`/`*ngFor`, and `cleanup-unused-imports` (last) drops the directives left unused.

---

## 3. control-flow

`@angular/core:control-flow-migration` (alias `control-flow`) – converts `*ngIf` / `*ngFor` / `*ngSwitch` to `@if` / `@for` / `@switch`.

| Flag       | Default | Purpose                                                                                                              |
| :--------- | :------ | :------------------------------------------------------------------------------------------------------------------- |
| `--path`   | `./`    | Directory to migrate                                                                                                 |
| `--format` | `true`  | Reformat migrated templates. Set `false` if it conflicts with your formatter (Prettier runs in the gauntlet anyway). |

**Gotcha**: every `@for` needs a `track`. The migration infers one (often `$index`); review for a stable identity key (e.g. `track item.id`) where it matters for performance.

---

## 4. self-closing-tag

`@angular/core:self-closing-tags-migration` (alias `self-closing-tag`) – rewrites empty element tags to self-closing (`<app-foo></app-foo>` → `<app-foo />`).

| Flag     | Default | Purpose              |
| :------- | :------ | :------------------- |
| `--path` | `./`    | Directory to migrate |

---

## 5. ngclass-to-class

`@angular/core:ngclass-to-class-migration` (alias `ngclass-to-class`) – `[ngClass]` → `[class]` / `[class.x]` bindings.

| Flag                         | Default | Purpose                                                |
| :--------------------------- | :------ | :----------------------------------------------------- |
| `--path`                     | `./`    | Directory to migrate                                   |
| `--migrateSpaceSeparatedKey` | `false` | Also migrate object literals whose keys contain spaces |

Best-effort: complex `[ngClass]` expressions it can't prove safe are left as-is – review what remains.

---

## 6. ngstyle-to-style

`@angular/core:ngstyle-to-style-migration` (alias `ngstyle-to-style`) – `[ngStyle]` → `[style]` / `[style.prop]` bindings.

| Flag               | Default | Purpose                                                            |
| :----------------- | :------ | :----------------------------------------------------------------- |
| `--path`           | `./`    | Directory to migrate                                               |
| `--bestEffortMode` | `false` | Also migrate object-reference styles (less certain; review output) |

---

## 7. inject

`@angular/core:inject-migration` (alias `inject`) – constructor parameter injection → `inject()` calls.

| Flag                                | Default | Purpose                                                                                            |
| :---------------------------------- | :------ | :------------------------------------------------------------------------------------------------- |
| `--path`                            | `./`    | Directory to migrate                                                                               |
| `--migrateAbstractClasses`          | `false` | Migrate abstract classes (their params aren't guaranteed injectable – off by default)              |
| `--backwardsCompatibleConstructors` | `false` | Keep a `constructor(...args: unknown[])` signature so subclasses don't break (more generated code) |
| `--nonNullableOptional`             | `false` | Cast optional `inject()` sites non-nullable to match `@Optional()` typing                          |

---

## 8. signal-input

`@angular/core:signal-input-migration` (aliases `signal-inputs`, `signal-input`) – `@Input()` fields → `input()` / `input.required()`, updating all references.

| Flag               | Default | Purpose                                                                                              |
| :----------------- | :------ | :--------------------------------------------------------------------------------------------------- |
| `--path`           | `./`    | Directory to migrate                                                                                 |
| `--analysisDir`    | `./`    | Wider directory to scan for references (use the repo root when inputs are consumed outside `--path`) |
| `--bestEffortMode` | `false` | Migrate as much as possible, skipping problematic patterns instead of bailing                        |
| `--insertTodos`    | `false` | Leave `// TODO` markers where an input couldn't be migrated                                          |

If the component uses `ngOnChanges`, treat this as an input migration plus a lifecycle migration. The
schematic can update reads, but it cannot always preserve previous-value semantics or imperative side
effects. Complete that conversion before checkpointing.

---

## 9. signal-queries

`@angular/core:signal-queries-migration` (aliases `signal-queries`, `signal-query`) – `@ViewChild` / `@ViewChildren` / `@ContentChild` / `@ContentChildren` → `viewChild()` / `viewChildren()` / `contentChild()` / `contentChildren()`.

Same flags as [signal-input](#8-signal-input): `--path`, `--analysisDir`, `--bestEffortMode`, `--insertTodos`.

If the query feeds `ngAfterViewInit`, DOM measurement, or an imperative third-party widget API,
treat this as a query migration plus a render-hook migration. Use guarded signal reads and
`afterNextRender()`, `afterEveryRender()`, or `afterRenderEffect()` where the old code depended on
view timing.

---

## 10. outputs

`@angular/core:output-migration` (alias `outputs`) – `@Output()` `EventEmitter` → `output()`.

| Flag            | Default | Purpose                                |
| :-------------- | :------ | :------------------------------------- |
| `--path`        | `./`    | Directory to migrate                   |
| `--analysisDir` | `./`    | Wider directory to scan for references |

---

## 11. route-lazy-loading

`@angular/core:route-lazy-loading-migration` (alias `route-lazy-loading`) – eager `component:` route references → lazy `loadComponent: () => import(...)`.

| Flag     | Default | Purpose              |
| :------- | :------ | :------------------- |
| `--path` | `./`    | Directory to migrate |

Only converts components that are standalone – run after the `standalone` migration.

---

## 12. router-testing-module-migration

`@angular/core:router-testing-module-migration` (no alias) – replaces the deprecated `RouterTestingModule` in `TestBed` with `provideRouter()`.

| Flag     | Default | Purpose                       |
| :------- | :------ | :---------------------------- |
| `--path` | `./`    | Directory of tests to migrate |

`RouterTestingModule` → `provideRouter([])`; `RouterTestingModule.withRoutes(routes)` → `provideRouter(routes)`.

---

## 13. cleanup-unused-imports

`@angular/core:cleanup-unused-imports` (no alias, **no flags**) – removes unused entries from standalone components' `imports` arrays.

**Runs project-wide** – there is no `--path`. Always run it **last**, after the other migrations have removed the usages (e.g. `control-flow` removing `NgIf`) that make imports dead.

---

## Signals shortcut

`@angular/core:signals` runs migrations 8–10 in one pass.

| Flag               | Default                          | Purpose                                        |
| :----------------- | :------------------------------- | :--------------------------------------------- |
| `--migrations`     | `["inputs","outputs","queries"]` | Which signal migrations to include             |
| `--path`           | `./`                             | Directory to migrate                           |
| `--analysisDir`    | `./`                             | Wider directory to scan for references         |
| `--bestEffortMode` | `false`                          | Migrate as much as possible                    |
| `--insertTodos`    | `false`                          | Leave `// TODO` markers for un-migratable code |

This skill runs inputs/queries/outputs individually so each gets its own gauntlet and checkpoint. Offer `signals` only when the user prefers a single commit for all three.
