# Interceptors & SSR

Verified against `@angular/common` and `@angular/platform-browser` v22.0.0.

## Functional interceptors

An interceptor is an `HttpInterceptorFn` – a function called for every request, running in an
injection context (so `inject()` works). It gets `(req, next)`: clone `req` to change it, then return
`next(req)`. Register them in order with `withInterceptors([...])`; each wraps the next.

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

// Attach an auth token (requests are immutable – clone to modify).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed);
};

// Map transport errors to a domain error once, centrally.
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((err) => throwError(() => new ApiError(err.status, req.url))));
```

```typescript
provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor]));
```

Notes:

- Order matters: listed order = request order (outer → inner); responses unwind inner → outer.
- Interceptors run for `httpResource`, `resource` built on `HttpClient`, and `rxResource` whose
  stream uses `HttpClient` – one place to add auth/logging/retry for the whole read+mutation layer.
- **XSRF** is handled by `withXsrfConfiguration` / `withNoXsrfProtection`, not a hand-written
  interceptor – see the **ng-security** skill.
- Legacy DI-based class interceptors need `withInterceptorsFromDi()`; prefer functional interceptors
  for new code.

## SSR: transfer cache & hydration

The app already calls `provideClientHydration(withEventReplay())`, and `provideHttpClient` is being
added. With both present, the **HTTP transfer cache is enabled by default**: HttpClient GET/HEAD
requests made while rendering on the server are serialized into the HTML and **replayed on the
client**, so hydration does not issue a second request (no double-fetch flicker). This is automatic
for `httpResource` and any `HttpClient`-backed `resource`/`rxResource`.

Tune it with hydration features from `@angular/platform-browser`:

```typescript
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';

provideClientHydration(
  withEventReplay(),
  withHttpTransferCacheOptions({
    includePostRequests: false, // GET/HEAD only by default
    includeRequestsWithAuthHeaders: false, // avoid caching per-user authorized responses
    filter: (req) => !req.url.includes('/live/'), // opt specific URLs out
    includeHeaders: [], // response headers to preserve in the cache
  }),
);
```

Disable entirely with `withNoHttpTransferCache()`.

### Plain `resource()` with `fetch()`

A `resource` that uses native `fetch` (not `HttpClient`) is **outside** the HTTP transfer cache. Give
it an `id` so its resolved value is stored in `TransferState` on the server and picked up on the
client instead of re-fetching:

```typescript
resource({ params: () => ({ id: this.id() }), loader, id: 'user' });
```

### Current repo state

`src/app/app.routes.server.ts` renders all routes with `RenderMode.Client` (browser-only grid deps),
so today no route is server-rendered and the transfer cache is inert. It becomes load-bearing the
moment a route switches to `RenderMode.Server` or prerendering – wire the options above now so that
switch is safe. Keep per-request state isolated (never share a global injector across SSR requests)
to avoid leaking one user's data into another's response (see ng-security).
