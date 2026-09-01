# Testing stores

A SignalStore is an Angular service – test it like one, with **TestBed** and **vitest**. General
test conventions and setup live in [ng-testing](../../ng-testing/SKILL.md); this file covers the
store-specific mechanics (verbatim per the official guide).

## Principles

- **Public API only.** Assert on state signals, computed values, and the effect of calling
  methods. Do not read private members or spy on the store's own methods – if a method grows
  complex, extract the logic into a service and mock that.
- **Use TestBed, not `new`.** `TestBed` supplies the injection context that `rxMethod()`,
  `signalMethod()`, and `inject()` inside features require.

## Injecting by scope

```ts
import { TestBed } from '@angular/core/testing';

// Global store: signalStore({ providedIn: 'root' }, ...)
const store = TestBed.inject(CounterStore);

// Local store: signalStore(withState(...))
TestBed.configureTestingModule({ providers: [CounterStore] });
const store = TestBed.inject(CounterStore);
```

## Asserting state, computed, and methods

```ts
it('updates doubleCount when count changes on increment', () => {
  const store = TestBed.inject(CounterStore);

  expect(store.count()).toBe(0);
  expect(store.doubleCount()).toBe(0);

  store.increment();
  expect(store.count()).toBe(1);
  expect(store.doubleCount()).toBe(2);
});
```

## Patching protected state – `unprotected`

State is protected by default, so `patchState` can't write it from a test. Wrap the instance with
`unprotected` from `@ngrx/signals/testing` to get a writable view – useful for driving a computed
without a public setter:

```ts
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';

patchState(unprotected(store), { count: 5 });
expect(store.doubleCount()).toBe(10);
```

## Mocking injected dependencies

When the store injects a service inside `withMethods`, provide a mock via `useValue`:

```ts
TestBed.configureTestingModule({
  providers: [{ provide: StepService, useValue: { getStep: () => 3 } }],
});
const store = TestBed.inject(CounterStore);
store.increment();
expect(store.count()).toBe(3);
```

## Testing `rxMethod`

Same idea as any method; `rxMethod` additionally accepts an `Observable`. A synchronous observable
runs the chain immediately; an async one needs polling:

```ts
import { of, scheduled, asyncScheduler } from 'rxjs';

it('adds synchronous emissions to count', () => {
  const store = TestBed.inject(CounterStore);
  store.increment(of(1, 2, 3));
  expect(store.count()).toBe(6);
});

it('adds async emissions after they flush', async () => {
  const store = TestBed.inject(CounterStore);
  store.increment(scheduled([1, 2, 3], asyncScheduler));
  expect(store.count()).toBe(0);
  await expect.poll(() => store.count()).toBe(6);
});
```

For `signalMethod` called with a signal, wait for the effect with `TestBed.tick()` or
`expect.poll`, and make the call inside `TestBed.runInInjectionContext(...)`.

## Mocking the store in a component test

When testing a component that consumes the store, replace it with a plain object exposing the same
shape – signals for state/computed, functions for methods – and prefer asserting the resulting
state change over asserting a method was called:

```ts
const count = signal(0);
const mockStore = {
  count,
  increment: () => count.set(count() + 1),
};
TestBed.configureTestingModule({
  providers: [{ provide: CounterStore, useValue: mockStore }],
}).createComponent(CounterComponent);
```

## Custom features

A `signalStoreFeature(...)` is tested by wrapping it in a minimal `signalStore` and asserting on
that store – no special harness needed.
