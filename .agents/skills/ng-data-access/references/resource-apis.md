# Resource APIs – httpResource, resource, rxResource

Verified against `@angular/common` and `@angular/core` v22.0.0. For conceptual depth defer to
[`../../angular-developer/references/resource.md`](../../angular-developer/references/resource.md);
this file is the project-shaped, compile-checked fast path.

## Shared shape

All three return a `ResourceRef<T | undefined>` (or `ResourceRef<T>` when you pass `defaultValue`)
exposing the same reactive signals:

| Member               | Type / meaning                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `value()`            | `Signal<T>` – resolved data (or `defaultValue`/`undefined` while idle/loading)                      |
| `status()`           | `Signal<ResourceStatus>` – `'idle' \| 'loading' \| 'reloading' \| 'resolved' \| 'error' \| 'local'` |
| `error()`            | `Signal<Error \| undefined>`                                                                        |
| `isLoading()`        | `Signal<boolean>` – true during `loading` **and** `reloading`                                       |
| `hasValue()`         | reactive type-guard: narrows `value()` to non-undefined                                             |
| `reload()`           | re-runs the loader without a param change; returns `boolean`                                        |
| `set()` / `update()` | optimistic local write ⇒ status becomes `'local'`                                                   |
| `destroy()`          | cancels pending requests, returns to `idle`                                                         |

`httpResource` refs additionally expose `headers()`, `statusCode()`, and `progress()` signals.

## httpResource – reactive read through HttpClient

Default choice for reads. The first argument is a **reactive function** returning a URL string (or a
full request object, or `undefined` to stay idle). Re-fetches whenever a read signal inside it
changes. Parses JSON by default.

```typescript
import { httpResource } from '@angular/common/http';

// URL form – query params via the request object, not string concatenation.
protected readonly search = signal('');
protected readonly results = httpResource<Product[]>(
  () => ({ url: '/api/products', params: { q: this.search() } }),
  { defaultValue: [] },
);

// Non-JSON payloads use sub-constructors:
protected readonly csv = httpResource.text(() => '/api/export.csv');
// also .blob(...) and .arrayBuffer(...)
```

Options (`HttpResourceOptions`): `defaultValue`, `parse` (validate/transform the raw response – ideal
for a Zod schema), `equal`, `injector`, `debugName`. Request object fields (`HttpResourceRequest`):
`url`, `method`, `body`, `params`, `headers`, `context`, `reportProgress`, `withCredentials`.

`parse` example (runtime validation at the boundary):

```typescript
protected readonly user = httpResource(
  () => `/api/users/${this.id()}`,
  { parse: (raw) => UserSchema.parse(raw) }, // returns the typed value
);
```

## resource – async read from a non-HttpClient source

Use when the data doesn't come through `HttpClient` (native `fetch`, a third-party SDK, any promise).
`params` is the reactive request; `loader` receives `{ params, abortSignal, previous }`.

```typescript
import { resource } from '@angular/core';

protected readonly userId = signal('123');
protected readonly user = resource({
  params: () => ({ id: this.userId() }),
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(`/api/users/${params.id}`, { signal: abortSignal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as User;
  },
  // SSR: an `id` caches the loaded value in TransferState so the client
  // doesn't re-fetch. HttpClient-backed resources get this automatically.
  id: 'user',
});
```

**Always forward `abortSignal`** to `fetch` so a superseded request is cancelled.

## rxResource – read whose loader is an Observable

Use when the fetch is naturally RxJS (debounce, `retry`, `switchMap`, merging streams). Bridges the
Observable to resource signals. Import from `@angular/core/rxjs-interop`.

```typescript
import { rxResource } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

protected readonly query = signal('');
protected readonly hits = rxResource({
  params: () => this.query(),
  stream: ({ params }) => this.api.search(params).pipe(debounceTime(0)),
  defaultValue: [],
});
```

The loader key is `stream` (returns `Observable<T>`), not `loader`.

## Mutations stay imperative

`resource`-family primitives are read-only and abort on destroy/param-change – never route a
POST/PUT/PATCH/DELETE through them. Call the typed service method (returns an `Observable`), then
`reload()` the affected read resource to refresh:

```typescript
this.userApi.update(id, patch).subscribe(() => this.user.reload());
```
