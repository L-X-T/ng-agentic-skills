---
name: ng-signal-store
description: Manage genuinely shared, multi-consumer state with @ngrx/signals SignalStore (withState / withComputed / withMethods / withEntities / rxMethod). Use when state must be shared across several components or routes and the user mentions state management, shared state, a store, NgRx, or SignalStore. Guard – prefer a local signal() / computed() or a signals-based service first; reach for a store only when state is truly shared. If @ngrx/signals is not in package.json, installation is a gated, explicit step.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# ng-signal-store

`@ngrx/signals` SignalStore is a declarative, Signal-native state container built from composable
features – `withState`, `withComputed`, `withMethods`, `withEntities`, `rxMethod` – and easy to
over-reach for. **Most state is component-local**; a store earns its keep only when state is
genuinely shared across many consumers. Pass the gate first, then install, then build.

## 1. The gate – do you actually need a store?

Walk the tree top to bottom and **stop at the first match**:

1. **State lives in and is used by one component** → `signal()` for state, `computed()` for
   derived values. This is the default and covers the majority of cases (the TypeScript style guide: signals for
   local component state).
2. **A parent owns state a few children read/write** → pass it down with `input()` / `output()` /
   `model()`, or a small **signals-based service** (`signal`s + `computed`s, `providedIn: 'root'`
   for app-wide, or component-`providers` for a subtree). No store yet.
3. **Fetching remote data** → `resource()` / `rxResource()` (per `style-guide/style-guide.ts.md`), owned by a data-access
   service – see [ng-data-access](../ng-data-access/SKILL.md). A store _consumes_ that; it does
   not replace it.
4. **State is genuinely shared by multiple, unrelated consumers** (across routes/features), with
   coordinated updates, meaningful derived state, and side effects → **SignalStore**.

**Anti-reach rule.** Do not introduce a store to dodge two levels of prop-drilling, to hold one
component's UI flags, or "for consistency". A `BehaviorSubject`-service is **never** the answer
here – the signals-based service in step 2 replaces that pattern. This mirrors
[ng-refactor](../ng-refactor/SKILL.md)'s Step-4 stance: _"SignalStore only if you truly need it."_

_Gate passed when_ you can name ≥2 independent consumers of the same state and why local signals
or a signals service can't serve them.

## 2. Install (only after the gate)

Check `package.json` first: if `@ngrx/signals` is missing, install it explicitly, matching the Angular major
(this repo is Angular 22):

```sh
pnpm add @ngrx/signals
# add @ngrx/operators too if you use tapResponse in rxMethod:
pnpm add @ngrx/operators
```

Prefer `pnpm exec ng add @ngrx/signals@latest` when you want the schematic. After install, confirm
the installed version's `peerDependencies` list `@angular/core` `^22` before continuing; if the
registry only offers an older major, stop and report rather than forcing an incompatible version.

## 3. Store anatomy

`signalStore(...features)` returns an **injectable service**. Compose it from features (verbatim
API per the official guide):

- **`withState(initialState)`** – an object literal; each slice becomes a `Signal`, nested objects
  become `DeepSignal`. Update only via `patchState(store, partialOrUpdaterFn)`.
- **`withComputed(({ slice }) => ({ ... }))`** – derived signals. Derived state lives **here**,
  never duplicated into `withState`.
- **`withMethods((store, dep = inject(Dep)) => ({ ... }))`** – updaters and side effects; runs in
  an injection context, so `inject()` works.

**Scope – two choices:**

- **Feature-scoped instance:** add to a component/route `providers: [Store]`. Tied to that
  component's lifecycle, fresh per mount – for state shared within one feature subtree.
- **App-wide singleton:** `signalStore({ providedIn: 'root' }, ...)` – one shared instance, only
  for truly global state.

Read in templates as `store.slice()`, `store.derived()`; call `store.method(arg)`.

## 4. Worked example

```ts
// counter-store.ts
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

type CounterState = { count: number; step: number };
const initialState: CounterState = { count: 0, step: 1 };

export const CounterStore = signalStore(
  withState(initialState),
  withComputed(({ count }) => ({
    doubleCount: computed(() => count() * 2),
  })),
  withMethods((store) => ({
    increment(): void {
      patchState(store, ({ count, step }) => ({ count: count + step }));
    },
    setStep(step: number): void {
      patchState(store, { step });
    },
  })),
);
```

```ts
// counter.ts
import { Component, inject } from '@angular/core';
import { CounterStore } from './counter-store';

@Component({
  selector: 'app-counter',
  providers: [CounterStore], // feature-scoped instance
  template: `
    <p>{{ store.count() }} (x2 = {{ store.doubleCount() }})</p>
    <button type="button" (click)="store.increment()">+{{ store.step() }}</button>
  `,
})
export class Counter {
  protected readonly store = inject(CounterStore);
}
```

## 5. Anti-patterns

- **God-store.** One mega-store for unrelated domains. Prefer one focused store per domain; the
  docs recommend dedicated stores over multiple collections in one store.
- **Derived state in `withState`.** Storing a value you can compute (`count * 2`, filtered lists)
  invites drift. Put it in `withComputed`.
- **Component-local state in a store.** UI toggles, hover flags, one-off form scratch → `signal()`
  in the component, not the store.
- **Store as a fetch layer.** Don't re-implement HTTP in the store; inject a data-access service
  and drive it via `rxMethod` / `resource` (see references + ng-data-access).
- **Reaching past the gate.** Introducing a store to avoid prop-drilling or replace a
  `BehaviorSubject` service.

## 6. Verify loop

1. `pnpm build` – types resolve, feature composition compiles.
2. `pnpm lint` (`--fix`) + `pnpm format`.
3. A store **vitest** test: `TestBed.inject(Store)`, assert initial state, derived values, and
   method effects (public API only) – [references/testing-stores.md](references/testing-stores.md)
   and [ng-testing](../ng-testing/SKILL.md).

_Done when_ build + lint are green and a test exercises the store's public API.

## References

- [references/entities-and-rxmethod.md](references/entities-and-rxmethod.md) – `withEntities` +
  entity updaters, and `rxMethod` for reactive side effects consuming ng-data-access.
- [references/testing-stores.md](references/testing-stores.md) – TestBed setup, scopes,
  `unprotected`, mocking dependencies, testing `rxMethod`.
