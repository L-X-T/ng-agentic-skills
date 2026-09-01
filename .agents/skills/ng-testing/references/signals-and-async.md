# Signal timing and zoneless async patterns

How reactive state settles in a Vitest + TestBed run, and which flush primitive matches each case.
These patterns target Angular 22 and Vitest 4; verify examples against the installed versions.

## Reading reactive state

- `signal`, `computed`, `linkedSignal` are **read by calling them**: `expect(cmp.total()).toBe(42)`.
- `computed` is lazy and memoized – it recomputes on the next read after a dependency changes, and
  only then. You do not need change detection to read the new value; you need it to see the value in
  the DOM.
- Set signal **inputs** through the component ref, never by assignment:

```ts
fixture.componentRef.setInput('value', 10);
fixture.detectChanges();
expect(fixture.componentInstance.doubled()).toBe(20);
```

## Effects flush on change detection

`effect()` callbacks run as part of change detection, not synchronously when a dependency changes.
Flush pending effects with either:

- `TestBed.tick()` – synchronously runs pending effects and model→UI sync (replaces the **deprecated**
  `TestBed.flushEffects()`), or
- `await fixture.whenStable()` – resolves once the fixture has no outstanding async work, having run CD.

```ts
const cmp = fixture.componentInstance;
cmp.query.set('ng');
TestBed.tick(); // effect that reacts to `query` now ran
expect(cmp.logged()).toBe('ng');
```

## Match the clock to the async work

| Situation                                            | Use                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| signal / computed / linkedSignal read                | nothing – just read it                                         |
| `effect()` result                                    | `TestBed.tick()` or `await fixture.whenStable()`               |
| Promise / microtask, `HttpClient` flush              | `await fixture.whenStable()`                                   |
| `setTimeout` / `setInterval`                         | `vi.useFakeTimers()` + `await vi.advanceTimersByTimeAsync(ms)` |
| RxJS `timer` / `interval` / `debounceTime` / `delay` | `vi.useFakeTimers()` + `await vi.advanceTimersByTimeAsync(ms)` |

[Angular `fakeAsync`](https://angular.dev/api/core/testing/fakeAsync) requires Zone.js and cannot
be used with Vitest. Use [Vitest fake timers](https://vitest.dev/guide/mocking/timers) for timer-dependent
behavior. Fake only the clocks the behavior uses, including `Date` for RxJS time calculations.
Advance the clock asynchronously, run change detection explicitly, and restore real timers even
when an assertion fails. Do not wait for fixture stability while its required timers are still frozen.

This example assumes `SearchComponent` renders `.results` after its 300 ms search debounce:

```ts
import { TestBed } from '@angular/core/testing';
import { expect, it, vi } from 'vitest';

it('debounces search', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  try {
    const fixture = TestBed.createComponent(SearchComponent);
    const element: HTMLElement = fixture.nativeElement;
    fixture.detectChanges();
    fixture.componentInstance.type('ng');
    await vi.advanceTimersByTimeAsync(299);
    fixture.detectChanges();
    expect(element.querySelector('.results')).toBeNull();
    await vi.advanceTimersByTimeAsync(1); // advance the debounce window
    fixture.detectChanges();
    expect(element.querySelector('.results')?.textContent).toContain('ng');
  } finally {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  }
});
```

## HttpClient: settle async without real network

`provideHttpClientTesting` keeps everything synchronous – a flushed request resolves on the next
microtask, so `await fixture.whenStable()` (not `fakeAsync`) is the natural drain:

```ts
service.load();
httpTesting.expectOne('/api/users').flush([{ id: 1 }]);
await fixture.whenStable();
expect(service.users()).toHaveLength(1);
httpTesting.verify();
```

## resource() / rxResource()

`resource()` runs its loader asynchronously; drive it with `provideHttpClientTesting` (or a fake
loader), then `await fixture.whenStable()` and assert `res.status()` / `res.value()`. For the store
and data-access shapes these tests target, defer to
[`ng-data-access`](../../ng-data-access/SKILL.md) and [`ng-signal-store`](../../ng-signal-store/SKILL.md);
this skill only covers how to make their reactive state settle in a test.
