# `ng update` migrations

Separate from the modernization schematics in [migration-details.md](migration-details.md), Angular ships **version migrations** that run **automatically** when you bump a package:

```shell
pnpm ng:update
# ↳ ng update @angular/cli @angular/core angular-eslint @angular-eslint/builder
```

`ng update` upgrades the packages, rewrites `package.json`, and then runs that version's migrations
to keep your code compiling and idiomatic. When an `ng-refactor` plan reaches its Update phase, or
when the user asks to update Angular directly, use `ng-migrate` for this workflow. This file is the
version-update branch; [migration-details.md](migration-details.md) covers the opt-in
modernization schematics.

## How to run them

- **Whole upgrade (normal path, this repo)**: `pnpm ng:update` – runs `ng update @angular/cli @angular/core angular-eslint @angular-eslint/builder`, applying version migrations as part of the update. In other repos, the generic `ng update @angular/core @angular/cli` is the fallback.
- **Preview only**: add `--dry-run` (alias `-d`) to see file changes without writing them.
- **Re-run after the fact**: `ng update @angular/core --migrate-only --from=<old> --to=<new>` runs the migrations without changing package versions.

The clean-tree precondition and the **gauntlet** from the main workflow apply here too – start
clean, then build/lint/test the upgraded tree before committing.

## Discovering the list for the installed version

These migrations are version-specific. Read the authoritative set for what's installed rather than trusting a fixed list:

```shell
# what an upgrade would do
ng update @angular/core --dry-run
```

Or inspect the package directly:

```
node_modules/@angular/core/schematics/migrations.json
```

## Snapshot – as of `@angular/core` v22.0.0 (illustrative)

| Migration                       | Effect                                                                                               |
| :------------------------------ | :--------------------------------------------------------------------------------------------------- |
| `change-detection-eager`        | Adds `ChangeDetectionStrategy.Eager` to all components                                               |
| `http-xhr-backend`              | Adds `withXhr` to `provideHttpClient` where `HttpXhrBackend` is used                                 |
| `strict-templates-default`      | Adds `strictTemplates: false` to `tsconfig.json` when unset                                          |
| `can-match-snapshot-required`   | Adds the required third argument to `canMatch` call sites                                            |
| `incremental-hydration`         | Adds `withNoIncrementalHydration()` opt-out to `provideClientHydration()` to retain pre-v22 behavior |
| `strict-safe-navigation-narrow` | Disables the `nullishCoalescingNotNullable` / `optionalChainNotNullable` extended diagnostics        |
| `model-output`                  | Fixes broken duplicate outputs                                                                       |
| `safe-optional-chaining`        | Wraps optional-chaining expressions in `$safeNavigationMigration()`                                  |

This table will differ on every Angular version – regenerate it from `migrations.json` for the
version you're on.
