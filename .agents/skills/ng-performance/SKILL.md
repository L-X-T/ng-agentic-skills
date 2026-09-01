---
name: ng-performance
description: Optimize the performance of an Angular (v17+) application – both initial load (bundle size, lazy loading, deferrable views, images, SSR/SSG/hydration) and runtime (change detection, OnPush, zoneless, slow templates, large lists, RxJS). Use when the user wants to make an Angular app load faster, fix slow rendering or janky change detection, reduce bundle size, improve Core Web Vitals / Lighthouse scores, or asks for a performance review/audit. Covers the angular.dev performance best practices.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Performance

A practical guide to making Angular apps fast. Two domains: **initial load** (how fast the
first meaningful paint and interactivity arrive) and **runtime** (how smoothly the app reacts
once loaded). Each fix follows **Problem → Identify → Fix → Verify (re-measure)** – always
confirm each win against the numbers, never assume it landed.

> Targets Angular v17+ and a standalone + signals + OnPush codebase. Module-based notes are
> marked _(legacy)_ for apps not yet migrated.

## 0. Measure first – never guess

Optimize what the tools flag, not what you assume is slow.

- **Initial load / Core Web Vitals (LCP, CLS, INP):** Lighthouse, PageSpeed Insights, WebPageTest.
- **Bundle composition:** `ng build` budget warnings; a source-map/import-graph visualizer to see why code lands in the main chunk.
- **Change detection cost:** **Angular DevTools** profiler (flame chart of CD cycles) and the **Chrome DevTools** Performance panel (Angular-aware, color-coded).
- **Agent-driven measurement:** this repo ships the **chrome-devtools MCP** – drive a real trace with `performance_start_trace` → interact with the page → `performance_stop_trace` → `performance_analyze_insight`, and `lighthouse_audit` for LCP/CLS/INP. Use it to establish the baseline and to re-measure after each fix.
- **Quick CD smell test:** a `console.log()` in `ngDoCheck` – if it fires on unrelated interactions, you have out-of-bound CD.

---

## Part 1 – Initial Load Performance

### 1.1 Assets & build

**Web performance basics** (biggest wins, often outside Angular): HTTP/3 + a CDN, correct browser
caching, Brotli/Gzip compression, modern image formats (`.webp` / `.avif` / `.svg`), and properly
sized images via `srcset`. Clean up and lazy-load unused JS/CSS.

**Production build & tree shaking.** Always ship the production build (`ng build`, optimization on
by default with the `application` builder). Ivy + AOT make the framework, your libs, and 3rd-party
libs tree-shakable. **Avoid large 3rd-party deps and CSS/component frameworks** – they dominate
bundle size.

**Image optimization with `NgOptimizedImage`.** Use `ngSrc` instead of `src`: it lazy-loads
off-screen images, prioritizes above-the-fold ones, and (with an image provider) generates
`srcset`/`sizes` and modern formats. Does **not** work for inline base64 images.

```html
<img ngSrc="hero.jpg" width="800" height="600" priority />
<!-- LCP image -->
<img ngSrc="thumb.jpg" width="120" height="120" />
<!-- lazy by default -->
```

### 1.2 Lazy loading & deferrable views

Goal: ship less JS up front. Trade-off: a small on-demand delay later (mitigate with preloading/prefetch).

**Lazy routes** – split features into their own chunks:

```ts
export const appRoutes: Routes = [
  { path: 'home', component: Home }, // eager (initial feature)
  { path: 'charts', loadComponent: () => import('./charts/charts') }, // standalone, preferred
  { path: 'admin', loadChildren: () => import('./admin/admin.routes') }, // child routes
];
```

**Lazy services** – an `providedIn: 'root'` service used only by one lazy chunk lands in that chunk;
used by several lazy chunks → a shared chunk; used by anything eager → the main bundle. For a
service backed by a heavy library, load it on demand with `injectAsync`.

**Preloading** – after the initial load, fetch lazy chunks before they're needed:

```ts
provideRouter(appRoutes, withPreloading(PreloadAllModules));
```

For big apps prefer a smarter strategy – `ngx-quicklink` (preloads links in the viewport) or a custom one.

**Common pitfalls:**

- **Don't lazy-load the initial feature** (home/login) – it just delays first paint.
- **Don't defeat lazy loading with a huge eager shared module** _(legacy)_ – split it into small focused modules so chunks stay lean.

**Deferrable views (`@defer`)** – lazy-load _parts of a template_ when route-based splitting doesn't
fit (e.g. a heavy 3rd-party widget below the fold). No router needed.

```html
@defer (on viewport; prefetch on idle) {
<app-heavy-chart />
} @placeholder (minimum 500ms) {
<img src="placeholder.avif" alt="" width="420" height="420" />
} @loading (after 500ms; minimum 1s) {
<app-spinner />
} @error {
<p>Couldn't load the chart.</p>
}
```

Triggers: `on idle | viewport | hover | interaction | timer(2s) | immediate`, or `when <boolean>`
(one-time, not reverted). Add `prefetch on …` to fetch ahead of the trigger.

### 1.3 SSR, SSG & hydration

**Server-Side Rendering (SSR)** – render on the server for fast first paint and SEO; best for public
pages (not behind login). Caveat: no `document` / `localStorage` / `sessionStorage` on the server –
inject browser APIs safely (e.g. `@ng-web-apis/common`).

**Prerendering (SSG)** – render important pages at build time; serves on any static host (nginx/Apache,
no Node needed). Available since v17 via `@angular/ssr` (opt-in with `ng add @angular/ssr`).

**Hybrid rendering (v19+)** – choose per route:

```ts
{ path: 'charts', renderMode: RenderMode.Client },    // SPA, static files
{ path: 'home',   renderMode: RenderMode.Server },    // SSR, live + hydration
{ path: 'post',   renderMode: RenderMode.Prerender }, // SSG, build-time + hydration
```

**Hydration** – reuse server-rendered DOM on the client instead of re-rendering (avoids flicker):

```ts
provideClientHydration(
  withEventReplay(), // v18+: replay clicks made before hydration finishes
  withIncrementalHydration(), // v19+: hydrate sections lazily, like @defer
);
```

**Incremental hydration** – keep server HTML static until needed, then hydrate on a trigger:

```html
@defer (hydrate on viewport) { <app-section /> }
<!-- also: hydrate on hover|interaction|timer, hydrate when <bool>, hydrate never -->
```

**Alternative:** a URL/edge cache (Cloudflare or any CDN) can stand in for SSR for cacheable pages.

---

## Part 2 – Runtime Performance

### 2.1 Change detection

CD synchronizes model → DOM, walking the component tree **root → leaves**. With Zone.js it's
triggered by patched events, XHR/`HttpClient`, and `setTimeout`/`setInterval`. The goal is to run CD
**less often** and over **fewer components**.

**Skip subtrees with `OnPush`.** `OnPush` is the default change detection in Angular v22+, so do not set `changeDetection:` explicitly; instead hunt for components that opt out (`ChangeDetectionStrategy.Eager`, or an explicit `Default` in pre-v22 code) and remove the opt-out. An `OnPush` component is only re-checked when it's "notified":

Notify it by: (1) firing an event inside it/its children, (2) changing a bound `@Input`/input/model
signal **by reference**, (3) emitting through the `async` pipe **or updating a signal** read in the
template, or (4) `cdr.markForCheck()` (escape hatch – `markForCheck()` flags this component up to root
for the next cycle; `detectChanges()` runs CD now for this subtree; `ApplicationRef.tick()` runs the
whole app).

Because `OnPush` slashes how many components each cycle re-checks, keep every component on the v22 default – the TypeScript style guide (`style-guide/style-guide.ts.md`) forbids setting the strategy explicitly or opting into `Eager`.

**Go zoneless (recommended for new apps).** Drops the Zone.js overhead – CD runs only when signals
change or events fire. Remove `zone.js` from polyfills and provide zoneless CD. Requires that you
notify Angular via signals / `async` pipe / `markForCheck()` (options 2–4 above).

**Fix zone pollution _(zone-based apps)_.** 3rd-party libs (charts, maps), `requestAnimationFrame`,
`setInterval`, or `MouseEvent` listeners can trigger redundant CD cycles. Identify via the DevTools
profiler, then run them outside Angular:

```ts
private readonly zone = inject(NgZone);
this.zone.runOutsideAngular(() => { /* chart animation, rAF loop, … */ });
```

Alternatives: `cdr.detach()` for a self-managing component, or going zoneless.

### 2.2 Slow templates (slow computations)

**Don't call methods or do work in templates** – they re-run every CD cycle.

- **Problem:** redundant calculations in `@if`/interpolation, e.g. `@if (computeExpensive())`.
- **Fix:** precompute into `signal`/`computed` state or boolean flags that change only when they should.
- **Formatting/transforming:** use **pure pipes** – they recompute only when their input reference changes.

### 2.3 Large lists & component trees

**Always `track` in `@for`** (required) – without a stable key Angular destroys and recreates DOM
nodes on every change:

```html
@for (flight of flights(); track flight.id) { … } @empty { No flights found. }
```

Native control flow (`@for`/`@if`/`@switch`) is faster than `*ngFor`/`*ngIf` and is mandated by AGENTS.md; migrate legacy code with `ng generate @angular/core:control-flow`.

**Avoid huge component trees (100+).** Render on demand: paginate, or use the CDK
`<cdk-virtual-scroll-viewport>` so only visible rows are in the DOM.

### 2.4 Perceived performance (UX)

- **Show the page immediately** with spinners / skeletons / preview thumbnails instead of blocking on the backend.
- **Optimistic updates** for actions like "like"/"save" – apply the change in the UI right away, roll back on error. Don't use it where a wrong result is costly.

### 2.5 RxJS subscription hygiene

Leaked subscriptions keep components alive and re-run work. **Unsubscribe from everything** (the one
exception is Router params). Prefer, in order:

```ts
// 1. async pipe – Angular manages it (also triggers markForCheck for OnPush)
items$ | async
// 2. takeUntilDestroyed() – ties the subscription to the component lifecycle
obs$.pipe(takeUntilDestroyed()).subscribe(…);
// 3. explicit Subscription + unsubscribe() in ngOnDestroy
```

Subscribe in a field initializer/constructor; if you need `@Input`s, use `ngOnInit`; elsewhere inject
`DestroyRef`. Even better – move state to **signals** and avoid manual subscriptions entirely.

---

## Quick checklist

**Initial load**

- [ ] Production build; watch bundle budgets; drop heavy 3rd-party deps
- [ ] `NgOptimizedImage` (`ngSrc`) with `priority` on the LCP image; modern formats + `srcset`
- [ ] CDN, HTTP/3, Brotli/Gzip, correct caching
- [ ] Lazy-load every feature route (`loadComponent`/`loadChildren`); don't lazy-load the first feature
- [ ] Preload lazy chunks (`PreloadAllModules` or quicklink)
- [ ] `@defer` heavy/below-the-fold pieces, with `prefetch` + placeholder/loading/error
- [ ] SSR/SSG for public pages; hydration with event replay + incremental hydration

**Runtime**

- [ ] No component opts out of the default `OnPush` (no explicit `changeDetection`, no `Eager`); zoneless is the v22 default
- [ ] No method calls / heavy work in templates – use signals/computed/pure pipes
- [ ] `track` in every `@for`; virtual scroll or paginate large lists
- [ ] Run noisy 3rd-party/timer code with `runOutsideAngular` (or go zoneless)
- [ ] Unsubscribe (async pipe / `takeUntilDestroyed`) or use signals
- [ ] Spinners/skeletons + optimistic updates for perceived speed

## References

- Angular – [Performance best practices](https://angular.dev/best-practices/performance)
- Angular – [NgOptimizedImage](https://angular.dev/guide/image-optimization), [Lazy loading](https://angular.dev/guide/routing/common-router-tasks#lazy-loading), [Deferrable views](https://angular.dev/guide/templates/defer), [SSR & hydration](https://angular.dev/guide/ssr), [Skipping subtrees](https://angular.dev/best-practices/skipping-subtrees), [Zone pollution](https://angular.dev/best-practices/zone-pollution), [Zoneless](https://angular.dev/guide/zoneless)
- CDK – [Virtual scrolling](https://material.angular.dev/cdk/scrolling/overview)
- `ngx-quicklink` – [npm](https://www.npmjs.com/package/ngx-quicklink)
