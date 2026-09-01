# SCSS architecture

How styling is _organized_ – the part a linter can't judge and the audit must reason about. Rule ids
in parentheses point back to [styling-checklist.md](styling-checklist.md).

## Global vs component styles (`SCSS-1`)

The default is **component-scoped**. A rule lives in `component.scss` unless it is genuinely global.

| Belongs **global** (`src/styles.scss` + partials) | Belongs in the **component** `.scss`           |
| :------------------------------------------------ | :--------------------------------------------- |
| Design tokens (CSS custom properties)             | Everything that styles _this_ component        |
| Resets / normalize, base element styles           | Component layout, local modifiers              |
| Fonts, breakpoints, shared mixins                 | Component-private custom properties on `:host` |
| Third-party / framework overrides                 | View-transition CSS is the exception → global  |

Two smells to flag: global CSS that targets a single component (push it down) and component CSS that
resets or themes the whole app (lift it up).

## Global-styles layer order (`SCSS-3`)

Organize global styles as partials, imported in this order:

1. **Variables** – breakpoints, colors, sizes
2. **Libraries & helpers** – CDK, Bootstrap, resets
3. **Fonts**
4. **Mixins**
5. **Objects**
6. **Variants**

## `@use` / `@forward`, not `@import` (`SCSS-2`)

Sass `@import` is deprecated (global namespace, duplicated output). Migrate:

```scss
// before
@import 'variables';
@import 'mixins';

// after
@use 'variables' as vars; // namespaced
@use 'mixins' as *; // only where a flat namespace is wanted
```

A barrel partial re-exports with `@forward`:

```scss
// styles/_index.scss
@forward 'variables';
@forward 'mixins';
```

Mechanical 1:1 swaps are **auto**; anything that changes call sites (namespacing previously-global
members) is **proposed**.

## File co-location & naming (`SCSS-4`)

`[angular.dev]`: a component's TS, HTML, and styles share one base name, kebab-cased, in one
directory – `user-profile.ts` / `user-profile.html` / `user-profile.scss`. Extra style files append
a describing word: `user-profile-settings.scss`.

## Design tokens vs `:host` knobs (`TOKEN-1`/`TOKEN-2`/`TOKEN-3`)

- **Global design tokens** → global CSS custom properties. App-wide, themeable, the single source of
  truth for color/spacing/typography.
- **Component knobs** → custom properties on **`:host`**. Component-specific dials a parent can
  override, without leaking the component's internals.
- **Never** hardcode raw colors in a component. Replace with a token or a `:host` knob.

```scss
// global: src/styles/_custom-properties.scss
:root {
  --t-color-accent: #3b82f6;
  --t-space-1: 0.5rem;
}

// component.scss
:host {
  --card-padding: var(--t-space-1); // a knob, defaulting to a token
  display: block;
  padding: var(--card-padding);
  color: var(--t-color-accent); // never a raw hex here
}
```

Custom properties are **not** prefixed even under `ViewEncapsulation.None` – only selectors are
(`ENC-2`).

## View Encapsulation decision guide (`ENC-*`)

Default is `Emulated`; set `encapsulation` only with a documented reason.

| Mode                              | When                                                                    | Cost                                                 |
| :-------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------- |
| **Emulated** (default)            | Almost always                                                           | Adds `[_ngcontent]` attributes to markup             |
| **None**                          | Global components; integrating third-party CSS; a design-system library | Styles become global – **prefix required** (`ENC-2`) |
| **ShadowDom**                     | Strong native isolation, better runtime scoping                         | No global styles reach in; tokens may not pierce     |
| **ExperimentalIsolatedShadowDom** | v22, stricter isolation                                                 | Experimental                                         |

`[deck]` recommends **Emulated as the default** and `None` for a design-system library you control.

## Specificity & nesting (`SEL-3`/`SEL-4`/`FORBID-1`/`FORBID-2`)

Most "appearance-affecting" risk lives here. Keep specificity low and flat:

- **≤ 2 nesting levels** (3 only with justification). Flatten with a **modifier** rather than a deep
  descendant chain: `.lxt-avatar--disabled`, not `… .lxt-avatar.lxt-is-disabled`.
- **Avoid `&`** – write the full selector so it's greppable.
- **`!important` and `::ng-deep` are specificity hacks** – removing them _will_ change the cascade.
  Replace `!important` by fixing the selector; replace `::ng-deep` by exposing a CSS custom property
  the child consumes. Verify visually after.

## Logical properties & modern CSS (`UNIT-5`/`UNIT-6`)

- Prefer **logical** properties (`margin-inline-start`, `padding-block`, `inset-inline`) over
  physical ones – they follow writing direction and simplify RTL.
- Prefer **`:has()`** for parent/sibling state over toggling a class from TypeScript, where browser
  support allows.

## Where view-transition CSS lives (`ADV-2`)

`[angular.dev]` is explicit: define view-transition animations in your **global** styles, not in
component styles – Angular's view encapsulation scopes component styles and they won't match the
`::view-transition-*` pseudo-elements. Enable with `withViewTransitions()`; keep the keyframes and
pseudo-element rules global.
