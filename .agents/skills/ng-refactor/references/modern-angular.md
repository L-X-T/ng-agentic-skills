# Modern Angular, migrations & best practices

What "modern" means for Step 4 (Modernize), plus the updates/security context from Step 3. Run
Angular package updates, automatic update migrations, and official
`ng generate @angular/core:*` schematics through [ng-migrate](../../ng-migrate/SKILL.md). This file
is the map of what to adopt and why, and the manual changes the schematics don't cover.

> The AI needs help here: keep the **Angular MCP** connected so it works from current docs, and
> turn the Angular ESLint best-practice rules on so the agent gets an explicit checklist.

## Modern Angular – adopt these

**Foundations**

- `inject()` over constructor injection.
- **Standalone** components/directives/pipes (the default in v20+; never set `standalone: true`).
- Native **control flow** (`@if` / `@for` / `@switch`) over `*ngIf` / `*ngFor` / `*ngSwitch`.
- **Reactivity** with signals and the game-changer `computed()` for derived state.
- Data binding with **`input`**, **`output`**, and **`model`**; signal **queries**; the
  **resource** API for async reads.

**Replace every lifecycle hook**

| Old                              | Modern replacement                                                           |
| :------------------------------- | :--------------------------------------------------------------------------- |
| `ngOnInit` field setup           | field initializer / `constructor` (keep it simple)                           |
| manual `subscribe()` in a hook   | `takeUntilDestroyed()`, or the `AsyncPipe` in the template                   |
| `ngOnChanges` reacting to inputs | `computed()` derived from signal `input()`, or `effect()`                    |
| `ngAfterViewInit` DOM work       | `afterNextRender()` / `afterEveryRender()` / `afterRenderEffect()`           |
| any empty hook                   | delete it (`@angular-eslint/no-empty-lifecycle-method` – better none at all) |

**Change detection & state**

- Default `OnPush` change detection + **zoneless** (both v22 defaults; remove explicit `changeDetection:` settings and any `Eager` opt-out).
- `SignalStore` only when you genuinely need shared state – don't reach for it by default; the
  when-to-use gate lives in [ng-signal-store](../../ng-signal-store/SKILL.md).
- **Signal Forms** for forms done right – see [ng-forms](../../ng-forms/SKILL.md).

## Angular migrations – opt-in is a must

Run these (catalog and gotchas in [ng-migrate](../../ng-migrate/references/migration-details.md)),
one per checkpoint:

- standalone
- build with esbuild & vite
- signal inputs, outputs & queries
- control flow
- lazy-loaded routes with `loadComponent`
- `inject()` & cleanup imports & self-closing tags & `ngClass` / `ngStyle` & router & common

Showcase: [Angular migrations](https://angular.dev/reference/migrations)

## Updates & security

**Updates** – keep Angular up to date for security and modern features:

- At least 2× per year (major), better every ~2 months (minor).
- Use [ng-migrate](../../ng-migrate/SKILL.md) for `ng update` / `nx migrate` style Angular updates
  and take the **automatic** migrations along.
- Bring other npm packages too – but that alone is not enough; the manual modernization above is
  where the value is.

**Security** – while versions move:

- CSP policies and a Trusted Types setup.
- Update everything, **especially 3rd-party packages**. Deeper pass: [ng-security](../../ng-security/SKILL.md).

## Ecosystem (optional, but recommended)

- **pnpm** over npm / yarn.
- **Stylelint** if you want to lint SCSS too.
- **Nx** for larger projects / libraries / monorepos.
- Component libraries / design systems: Angular Material, or ZardUI (lean, shadcn-based) – great
  when a usable Figma MCP exists.
- Testing: **Playwright** e2e (the most valuable safety net), **Vitest** unit (possibly Analog for
  tooling), **Storybook** for UI component docs. Migrate the rest where possible – with AI.

## Angular ESLint best-practice rules

Turn these on so the linter enforces modern Angular (the agent needs the explicit hint).

**TypeScript (`*.ts`)**

- `@angular-eslint/no-empty-lifecycle-method` – better no lifecycle method at all
- `@angular-eslint/prefer-on-push-component-change-detection`
- `@angular-eslint/prefer-output-readonly`
- `@angular-eslint/prefer-signals`
- `@angular-eslint/prefer-standalone`

**Templates (`*.html`)**

- `@angular-eslint/template/attributes-order`
- `@angular-eslint/template/button-has-type`
- `@angular-eslint/template/prefer-control-flow`
- `@angular-eslint/template/prefer-ngsrc`
- `@angular-eslint/template/prefer-self-closing-tags`

## Style guides

- Official Angular v20+ coding style guide: [angular.dev/style-guide](https://angular.dev/style-guide)
  – one concept per file with `inject()`; group Angular-specific properties before methods; keep
  components/directives focused on presentation; avoid complex template logic; `protected` for
  template-only members; `readonly` for properties that shouldn't change.
- This repo's style guide lives in [`style-guide/`](../../../../style-guide/style-guide.md) – load the
  per-file guide for whatever you're touching (`.ts`, `.html`, `.scss`, specs, …).
