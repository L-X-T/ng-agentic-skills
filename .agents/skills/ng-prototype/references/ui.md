# Angular UI prototype

Generate **several radically different UI variations** on a single Angular route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), then throws the rest away.

If the question is about logic/state rather than what something looks like – wrong branch. Use [logic.md](logic.md).

## Angular rules

Every component you write follows these (and the style guides in [SKILL.md](../SKILL.md) → _Read first_):

- Standalone components; do **not** set `standalone: true` (it's the default in v20+). Rely on the default `OnPush` change detection (v22+); do **not** set `changeDetection` explicitly.
- Signal APIs: `input()`, `output()`, `model()`, `computed()`, `signal()`. Avoid lifecycle hooks without a clear reason.
- Native control flow `@if` / `@for` / `@switch`. No `*ngIf`, `*ngFor`, `*ngSwitch`, `[ngClass]`, or `[ngStyle]` – use `class` / `style` bindings.
- Path-based routing with `loadComponent`. No `withHashLocation()` or hard-coded `#/...` links.
- Use Signal Forms for new prototype forms; follow the project style guide and [ng-forms](../../ng-forms/SKILL.md).
- Host bindings and listeners go in the `host` object, never `@HostBinding` / `@HostListener`.
- Import the app's real components when one fits; only hand-roll UI for the thing being prototyped. Keep local SCSS to layout and composition, follow `style-guide/style-guide.scss.md`, and use the app's existing design tokens/variables – don't hardcode colours, spacing, or radii a token already covers.
- Include realistic states: selected, disabled, invalid, loading, empty, and error where relevant. Keep accessibility intact (AGENTS.md: AXE + WCAG AA).
- Do not create or modify `.spec.ts` files.

## Two sub-shapes – strongly prefer sub-shape A

A UI prototype is much easier to judge when it's **butting up against the rest of the app** – real header, real data, real density. A throwaway route on its own is a vacuum: every variant looks fine in isolation. Default to sub-shape A whenever there's a plausible existing page to host the variants.

### Sub-shape A – adjustment to an existing route (preferred)

The route already exists. Variants render **on the same route**, gated by a `?variant=` query param. The existing data resolving, route params, and guards all stay – only the rendered subtree swaps. If the thing being prototyped doesn't yet have a page but _would naturally live inside one_ (a new section, a new card, a new step in a flow), that's still sub-shape A: mount the variants inside the host component.

### Sub-shape B – a new route (last resort)

Only when the thing genuinely has no existing route to live inside – an entirely new top-level surface, or a flow that can't be embedded anywhere sensible. Add a **throwaway route** with `loadComponent`, following the app's routing convention; don't invent a new top-level structure. Name it so it's obviously a prototype, e.g. `src/app/prototype-<name>/`. Same `?variant=` pattern.

In both sub-shapes the floating bottom bar is identical.

## Process

### 1. State the question and pick N

Default to **3 variants**. More than 5 stops being radically different and starts being noise – cap there. Write the plan in one line at the top of the host component:

> "Three variants of the orders screen, switchable via `?variant=`, on the existing `/orders` route."

### 2. Generate radically different variants

One standalone component per variant, clearly named (`OrdersVariantAComponent`, …). Hold each to the page's purpose and the data it has access to, and to the app's component and styling conventions. Variants must be **structurally different** – different layout, information hierarchy, and primary affordance, not just different colours. Three slightly-tweaked card grids isn't a UI prototype, it's wallpaper. If two come out too similar, redo one with explicit "do not use a card grid" guidance.

### 3. Wire them on the route

A single host component reads the param and renders one variant:

```typescript
@Component({
  selector: 'app-orders-prototype',
  imports: [OrdersVariantAComponent, OrdersVariantBComponent, OrdersVariantCComponent, PrototypeSwitcherComponent],
  template: `
    @switch (variant()) {
      @case ('B') {
        <app-orders-variant-b [orders]="orders()" />
      }
      @case ('C') {
        <app-orders-variant-c [orders]="orders()" />
      }
      @default {
        <app-orders-variant-a [orders]="orders()" />
      }
    }
    @if (isDev) {
      <app-prototype-switcher [variants]="variants" [current]="variant()" />
    }
  `,
})
export class OrdersPrototypeComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly isDev = isDevMode();
  protected readonly variants = ['A', 'B', 'C'] as const;
  private readonly params = toSignal(this.route.queryParamMap);
  protected readonly variant = computed(() => this.params()?.get('variant') ?? 'A');
  // Sub-shape A: keep the existing data source; variants receive it via input().
  protected readonly orders = inject(OrdersStore).orders;
}
```

For sub-shape A, the existing data stays on the host and flows into each variant via `input()`. For sub-shape B, the throwaway route under `src/app/prototype-<name>/` mounts the same host with stub data.

### 4. Build the floating switcher

A small fixed-position bar at the bottom-centre with three pieces: a **left arrow** (previous, wraps), a **variant label** (the current key plus the variant's name, e.g. `B – Sidebar layout`), and a **right arrow** (next, wraps).

```typescript
@Component({
  selector: 'app-prototype-switcher',
  host: { '(document:keydown)': 'onKey($event)' },
  template: `…`,
})
export class PrototypeSwitcherComponent {
  readonly variants = input.required<readonly string[]>();
  readonly current = input.required<string>();
  private readonly router = inject(Router);

  protected go(delta: number): void {
    const list = this.variants();
    const i = (list.indexOf(this.current()) + delta + list.length) % list.length;
    this.router.navigate([], { queryParams: { variant: list[i] }, queryParamsHandling: 'merge' });
  }

  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable]')) return;
    if (event.key === 'ArrowLeft') this.go(-1);
    if (event.key === 'ArrowRight') this.go(1);
  }
}
```

- Arrow clicks and the `←` / `→` keys both cycle; navigation merges the `variant` query param so the URL is shareable and reload-stable.
- Don't intercept arrow keys when an `<input>`, `<textarea>`, or `[contenteditable]` is focused.
- Make it visually distinct from the page (high-contrast pill, subtle shadow) so it's obviously not part of the design being evaluated.
- Gate it on `isDevMode()` so a stray prototype merge can't ship the bar to users.
- Keep it in one shared component both sub-shapes reuse.

### 5. Hand it over

Surface the URL and the `?variant=` keys. The user flips through whenever they get to it. The interesting feedback is usually **"I want the header from B with the sidebar from C"** – that's the actual design they want.

### 6. Verify

- `pnpm lint` (`ng lint`), and `pnpm build` (`ng build`) if the prototype is wired into the build.
- Reuse the running dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:4200` returning `200` means it is up. If nothing answers, ask for approval before running `pnpm start`; never start a second server on a busy port. Open the route, flip through every variant, inspect the rendered UI, and check the console for errors.
- Confirm accessibility from semantic markup, labels, focus order, and contrast (AGENTS.md: AXE + WCAG AA).
- Do not write or run Playwright / e2e tests.

If verification can't run, report the exact reason and the commands still needed.

### 7. Capture the answer and clean up

Capture the answer (see [SKILL.md](../SKILL.md) → _When done_) – note which variant won and why. Then:

- **Sub-shape A** – delete the losing variants and the switcher; fold the winner into the existing component.
- **Sub-shape B** – promote the winning variant to a real route; delete the throwaway route and the switcher.

Don't leave variant components or the switcher lying around. They rot fast and confuse the next reader.

## Anti-patterns

- **Variants that differ only in colour or copy.** That's a tweak, not a prototype. Real variants disagree about structure.
- **Sharing too much code between variants.** A shared header is fine; a shared layout defeats the point. Each variant should be free to throw out the layout.
- **Wiring variants to real mutations.** Read-only prototypes are fine. If a variant needs to mutate, point it at a stub – the question is "what should this look like", not "does the backend work".
- **Promoting the prototype directly to production.** The variant code was written under prototype constraints (no tests, minimal error handling). Rewrite it properly when you fold it in.
