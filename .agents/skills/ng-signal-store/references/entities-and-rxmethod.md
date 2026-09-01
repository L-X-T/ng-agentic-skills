# Entities and rxMethod

Two features you reach for once a store manages a collection or drives async side effects. APIs
below are verbatim from the official `@ngrx/signals` guide (Angular-major-matched release).

## `withEntities` – collections

`withEntities<T>()` from `@ngrx/signals/entities` integrates entity state. By default entities
need an `id` of type `EntityId` (`string | number`). It adds:

- `entityMap: Signal<EntityMap<T>>` – state slice keyed by id.
- `ids: Signal<EntityId[]>` – state slice, ordered ids.
- `entities: Signal<T[]>` – **computed** array of all entities.

```ts
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { addEntity, removeEntities, updateAllEntities, withEntities } from '@ngrx/signals/entities';

type Todo = { id: number; text: string; completed: boolean };

export const TodosStore = signalStore(
  withEntities<Todo>(),
  withMethods((store) => ({
    addTodo(todo: Todo): void {
      patchState(store, addEntity(todo));
    },
    removeEmptyTodos(): void {
      patchState(
        store,
        removeEntities(({ text }) => !text),
      );
    },
    completeAllTodos(): void {
      patchState(store, updateAllEntities({ completed: true }));
    },
  })),
);
```

### Entity updaters

Standalone functions used inside `patchState(store, updater)`. All are no-throw when the target
does not exist.

| Updater                                                 | Effect                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| `addEntity(e)` / `addEntities([e])`                     | Add; ignore if id already present                          |
| `prependEntity(e)` / `prependEntities([e])`             | Add at the front; ignore if id present                     |
| `setEntity(e)` / `setEntities([e])`                     | Add **or replace**                                         |
| `setAllEntities([e])`                                   | Replace the whole collection                               |
| `upsertEntity(e)` / `upsertEntities([e])`               | Add or **merge** provided props into the existing entity   |
| `updateEntity({ id, changes })`                         | Partial update by id; `changes` object or `(e) => Partial` |
| `updateEntities({ ids \| predicate, changes })`         | Partial update many, by ids or predicate                   |
| `updateAllEntities(changes)`                            | Partial update every entity                                |
| `removeEntity(id)` / `removeEntities(ids \| predicate)` | Remove by id(s) or predicate                               |
| `removeAllEntities()`                                   | Clear the collection                                       |

```ts
patchState(store, updateEntity({ id: 1, changes: { completed: true } }));
patchState(store, updateEntity({ id: 1, changes: (todo) => ({ completed: !todo.completed }) }));
patchState(
  store,
  removeEntities((todo) => todo.completed),
);
```

### Custom id and named collections

- **Custom id:** `const selectId: SelectEntityId<Todo> = (t) => t.key;` then pass `{ selectId }` as
  the optional second arg to every `add*` / `set* `/ `update*` updater (`remove*` infers it).
- **Named collections:** `withEntities({ entity: type<Todo>(), collection: 'todo' })` renames
  properties to `todoIds` / `todoEntityMap` / `todoEntities`; every updater then needs
  `{ collection: 'todo' }`. Use `entityConfig({ entity: type<Todo>(), collection, selectId })` to
  declare it once and pass the config to both `withEntities` and the updaters. A `_`-prefixed
  collection name (`'_todo'`) makes it private; re-expose via `withComputed`.
- Prefer **one dedicated store per entity type** over many collections in one store.

## `rxMethod` – reactive side effects

`rxMethod` from `@ngrx/signals/rxjs-interop` turns a chain of RxJS operators into a reactive
method. Its input accepts a **static value, a signal, a computation function, or an Observable**;
when given a signal/observable it re-runs on every emission. It must be created in an injection
context and is auto-cleaned when that injector is destroyed.

```ts
import { computed, inject } from '@angular/core';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { BooksService } from './books-service';

export const BookSearchStore = signalStore(
  withState({ books: [], isLoading: false }),
  withMethods((store, booksService = inject(BooksService)) => ({
    loadByQuery: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          booksService.getByQuery(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books }),
              error: console.error,
              finalize: () => patchState(store, { isLoading: false }),
            }),
          ),
        ),
      ),
    ),
  })),
);
```

Wire a signal to it in the consumer's constructor so it re-fetches on change:

```ts
constructor() {
  this.store.loadByQuery(this.store.filter.query); // re-runs whenever the signal changes
}
```

### Integration with ng-data-access – don't duplicate fetching

The store **orchestrates**; the fetching lives in a data-access service (see
[ng-data-access](../../ng-data-access/SKILL.md)):

- Inject the data-access service into `withMethods` and call it from inside `rxMethod` (as above).
  `tapResponse` (from `@ngrx/operators`) keeps the reactive chain alive on error.
- For pure declarative loading tied to a param signal, prefer `resource()` / `rxResource()` in the
  data-access layer and let the store hold only the coordinated/derived state around it.
- Never re-implement `HttpClient` calls, retry, or caching in the store – that belongs to
  data-access. The store consumes it.

## Could-not-verify notes

- Registry at authoring time exposed `@ngrx/signals` latest `21.1.1` peering `@angular/core ^21`;
  a `^22` release was not yet confirmable. The APIs above are stable across recent majors, but
  verify the installed version's peer range before relying on it.
