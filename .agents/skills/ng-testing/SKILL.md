---
name: ng-testing
description: Write Vitest unit and component tests for Angular – TestBed for standalone + zoneless components, signal/computed assertions, DI and HttpClient mocking, and CDK component harnesses. Use when the user wants to unit-test or spec a component, service, pipe, signal, or computed, mentions Vitest, TestBed, HttpTestingController, or component harnesses, or says "test this component/service". Not for browser end-to-end tests – use create-e2e-tests.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Testing (Vitest)

Fast, deterministic unit and component tests through **TestBed** on a **zoneless** app. Assert
_public behavior_ – signal outputs, rendered DOM, emitted outputs – never private fields. This is
the how-to for in-process tests; browser end-to-end work belongs to
[`create-e2e-tests`](../create-e2e-tests/SKILL.md). Before writing or editing any `.spec.ts`, read
[`style-guide/style-guide.spec.md`](../../../style-guide/style-guide.spec.md) – its Must/Should/Don't
rules win over anything here.

## 1. Detect the setup – gate before writing

Per `AGENTS.md`: **if no Vitest setup is found, do not write or modify `.spec.ts` files.** Confirm at
least one of:

- `angular.json` `test` target uses `@angular/build:unit-test` (runner defaults to `vitest`), or
- a `vitest.config.*` exists, and
- `vitest` is in `devDependencies`.

None present → stop and report; do not scaffold a runner unprompted.

_Done when_ Vitest is confirmed present, or you have refused with the reason.

## 2. Run commands

This repo: `pnpm test` → `ng test` (Vitest, jsdom). Use `pnpm exec ng test` to pass flags:

- **Full suite** once: `pnpm test --watch=false`
- **One file**: `pnpm exec ng test --watch=false --include=src/app/…/foo.component.spec.ts`
- **By test name**: `pnpm exec ng test --watch=false --filter="emits on submit"`
- **Watch**: `pnpm exec ng test --watch` (already the TTY default)
- **Coverage**: `pnpm exec ng test --watch=false --coverage`

## 3. TestBed essentials – standalone + zoneless

Standalone components/pipes go in `imports`, not `declarations`. Zoneless is the Angular v22 default
(`style-guide/style-guide.ts.md`), so TestBed runs zoneless out of the box; add
`provideZonelessChangeDetection()` to the test setup only when a legacy exercise still boots the
application with Zone.js, so the tests stay zoneless regardless.

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

TestBed.configureTestingModule({
  imports: [ButtonComponent],
  providers: [provideZonelessChangeDetection()],
});
const fixture = TestBed.createComponent(ButtonComponent);
fixture.componentRef.setInput('destructive', true); // set signal inputs, never assign
fixture.detectChanges(); // OnPush: one CD pass binds inputs, runs effects
expect(fixture.nativeElement.className).toContain('destructive');
```

- Set signal inputs with `fixture.componentRef.setInput(name, value)`.
- For OnPush, **assert after `fixture.detectChanges()`** (synchronous pass) or
  `await fixture.whenStable()` (drives CD + drains async). Under zoneless the fixture auto-detects,
  so `whenStable()` alone reflects async updates.
- Read a component signal directly: `expect(fixture.componentInstance.count()).toBe(1)`.

## 4. Signals-first assertions

`signal` / `computed` / `linkedSignal` are read by calling them; `computed` recomputes lazily on
read once a dependency changes. `effect()` runs during change detection – flush pending effects with
`TestBed.tick()` (replaces the deprecated `flushEffects()`) or `await fixture.whenStable()`.

Use Vitest fake timers for `setTimeout`/`setInterval` and RxJS time operators: enable them with
`vi.useFakeTimers()`, advance with `await vi.advanceTimersByTimeAsync(ms)`, and restore with
`vi.useRealTimers()` during cleanup. Angular `fakeAsync` requires Zone.js and does not work with
this Vitest setup. Full timing rules and `resource()`/`rxResource()` patterns:
[`references/signals-and-async.md`](references/signals-and-async.md).

## 5. DI & HTTP mocking

Mock the HTTP backend with `provideHttpClientTesting`; assert requests via `HttpTestingController`.

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()];

const httpTesting = TestBed.inject(HttpTestingController);
service.load();
httpTesting.expectOne('/api/users').flush([{ id: 1 }]);
afterEach(() => httpTesting.verify()); // no unexpected/outstanding requests
```

Fake an injected service with a provider override: `{ provide: UserService, useValue: fakeUserService }` –
override only the seam that isolates the unit; keep everything else real (§7). For
`resource()`/`HttpClient`-backed stores, cross-check
[`ng-data-access`](../ng-data-access/SKILL.md) and [`ng-signal-store`](../ng-signal-store/SKILL.md).

## 6. Component harnesses over raw DOM

Prefer a **CDK component harness** to `querySelector` chains: harnesses expose a behavior-level API,
survive DOM restructuring, and auto-run change detection. Get one via `TestbedHarnessEnvironment`:

```ts
const loader = TestbedHarnessEnvironment.loader(fixture);
const button = await loader.getHarness(ButtonHarness);
await button.click();
```

Writing a custom harness, and a spartan-ng example: [`references/harnesses.md`](references/harnesses.md).

## 7. Test-quality rules

- **One behavior per `it`** – descriptive `describe`/`it`; no order dependence; no committed `.only`/`.skip`.
- **Real code over mocks** – mock only true boundaries (HTTP, time, third parties); never test framework internals.
- **Stable queries** – role/label/text or harnesses; never `_ngcontent-*` / `ng-reflect-*`.

These align with the anti-patterns catalogue in
[`test-driven-development/references/testing-anti-patterns.md`](../test-driven-development/references/testing-anti-patterns.md) –
read it there; for when/order discipline see [`test-driven-development`](../test-driven-development/SKILL.md).

## 8. Verify loop

1. For new behavior, run the **new spec alone** and observe the expected failure (`--include=<file>`). For existing behavior, keep a passing characterization baseline and prove red-capability with a scoped temporary mutation in an isolated copy.
2. Make it pass; keep assertions meaningful (never gut one to force green).
3. Run the **full suite once** (`pnpm test --watch=false`) to catch cross-test breakage.

A stubborn red that points at production code is a feedback loop for
[`diagnosing-bugs`](../diagnosing-bugs/SKILL.md), not a reason to weaken the test.

_Done when_ the spec went red→green and the full suite is green.

## Checklist

- [ ] Vitest setup confirmed (else refused per `AGENTS.md`)
- [ ] `provideZonelessChangeDetection()` in providers; inputs via `setInput`
- [ ] Signals asserted through public reads; Vitest fake timers used for timer-dependent behavior and restored
- [ ] HTTP mocked with `provideHttpClientTesting`; `httpTesting.verify()` in `afterEach`
- [ ] Harnesses (not brittle DOM queries) for component interaction
- [ ] Spec ran red→green; full suite green; no `.only`/`.skip` left
