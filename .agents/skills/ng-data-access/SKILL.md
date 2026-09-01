---
name: ng-data-access
description: Build the typed server-communication layer in Angular v22+ – fetch data through httpResource/resource/rxResource backed by HttpClient, with functional interceptors, loading/error/reload state, and SSR-safe transfer caching. Use when fetching data, writing an API service, wiring HttpClient, choosing httpResource vs resource vs rxResource, adding an interceptor, or surfacing loading/error/reload state. The project's TypeScript style guide prefers resource()/rxResource()/httpResource() over "RxJS + async pipe" for reads.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Data Access

The server-communication layer is **signals-first**: a reactive request drives an async loader, and
status/value/error come back as synchronous signals you read straight in an `OnPush` template. Reads
go through `resource`-family primitives (preferred by `style-guide/style-guide.ts.md` over "RxJS + async pipe"); mutations
stay imperative `HttpClient` calls. Everything routes through the `HttpClient` stack so interceptors,
testing, and SSR transfer cache apply uniformly.

For exhaustive resource API depth, defer to the canonical
[`../angular-developer/references/resource.md`](../angular-developer/references/resource.md) (synced
from Angular's official skill). This skill owns the project-shaped layer: wiring, service shape,
interceptors, error UX, and SSR.

## 1. Wire HttpClient first

Check `app.config.ts` first: if it lacks **`provideHttpClient`**, add it before any fetch works. Use `withFetch()` so
requests run on the Fetch API (SSR-friendly, streaming-capable):

```typescript
// src/app/app.config.ts
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // …existing providers, incl. provideClientHydration(withEventReplay())
    provideHttpClient(
      withFetch(),
      withInterceptors([
        /* fns */
      ]),
    ),
  ],
};
```

`provideClientHydration()` is already present, so the **HTTP transfer cache is on by default** – any
HttpClient-backed fetch during SSR is replayed on the client without a second request. See
[`references/interceptors-and-ssr.md`](references/interceptors-and-ssr.md).

_Done when_ `provideHttpClient(withFetch())` is in `app.config.ts` and the app builds.

## 2. Pick the primitive

| Need                                                                      | Use                                         |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| Reactive read through HttpClient (interceptors, transfer cache)           | **`httpResource`** – default for reads      |
| Async read from a non-HttpClient source (fetch, SDK, promise)             | **`resource`**                              |
| Read whose loader is naturally an Observable (debounce, retry, switchMap) | **`rxResource`**                            |
| One-shot call or a mutation (POST/PUT/PATCH/DELETE on user action)        | **plain `HttpClient`** (returns Observable) |

`resource`/`httpResource`/`rxResource` are **read-only** – they cancel in-flight loads via
`AbortSignal` on destroy or param change, which would abort a mutation. Never fetch a mutation
through them. Details and verified examples: [`references/resource-apis.md`](references/resource-apis.md).

### Worked example – signal params → httpResource → template states

```typescript
import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { User } from './user-api';

@Component({
  selector: 'app-user-card',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p class="error" role="alert">Couldn't load user. <button (click)="user.reload()">Retry</button></p>
    } @else {
      <p>{{ user.value()?.name }}</p>
    }
  `,
})
export class UserCard {
  protected readonly userId = signal('123');
  // Re-fetches whenever userId() changes; undefined URL ⇒ resource stays idle.
  protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```

## 3. Typed service shape

Group HTTP concerns behind a root-provided service with typed models. Expose mutations as methods
returning `Observable`; let components/stores create the read `httpResource` at the call site.

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  create(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }
  update(id: string, patch: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, patch);
  }
}
```

Signal stores consume this layer – they hold state, not fetching logic (see ng-signal-store). Form
submits call the mutation methods (see ng-forms).

## 4. Loading / error / reload UX

Read the state as signals, never subscribe manually:

- `isLoading()` – gate a spinner (covers both `loading` and `reloading`).
- `error()` – `Signal<Error | undefined>`; show a recoverable message with a **retry** wired to `reload()`.
- `hasValue()` – reactive type-guard; prefer over `value() !== undefined`.
- `value()` – keeps the previous value during `reloading`, so the UI need not flash empty.

Give `error()` branches `role="alert"` and always offer `reload()` – a dead-end error is a bug.

## 5. Verify loop

- Types: `pnpm exec tsc --noEmit` (or `pnpm build`).
- Lint: `pnpm lint`.
- Test: a vitest spec with `provideHttpClientTesting()` + `HttpTestingController` to expect/flush
  requests offline – see the ng-testing skill for the harness.

_Done when_ tsc + lint pass and the fetch behaviour is covered by a test.

## Cross-links

- **ng-security** – XSRF (`withXsrfConfiguration`), SSR `allowedHosts`. Don't re-teach here.
- **ng-testing** – `HttpTestingController` harness for the specs above.
- **ng-signal-store** – stores consume this layer; don't duplicate fetching in them.
- **ng-forms** – form submission calls the service's mutation methods.
