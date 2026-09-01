# Styling checklist – the rule catalog

The full set of rules `ng-styling` audits, grouped by the eight core categories plus advisory.
Every rule carries:

- **Severity** – 🔴 Must · 🟡 Should · 🔵 Advisory
- **Sources** – `[repo]` (this project's [style guide](../../../../style-guide/style-guide.md)) ·
  `[deck]` (the _"Angular Styling"_ deck) · `[angular.dev]` (the official guide)
- **Detect** – what to grep / look for
- **Fix** – the change, and whether it's **auto** (mechanical, applied per batch on approval) or
  **proposed** (judgment-heavy / specificity- or layout-affecting – presented as a diff to decide)

> Many "Fix: proposed" items can change rendered output (specificity, layout). Treat them as
> **appearance-affecting** and verify visually – see the gauntlet in [SKILL.md](../SKILL.md).

---

## 1. Template bindings (`BIND`)

**BIND-1** 🔴 `[repo]` `[deck]` `[angular.dev]` – Use `[class.name]="cond"` instead of `[ngClass]`.

- Detect: `ngClass` in `*.html` / inline templates.
- Fix: `[class.active]="f.id === selected.id"`; for many classes `[class]="{ active: …, dense: … }"`.
  NgClass also carries an extra runtime cost over native bindings (`[angular.dev]`). **auto**

**BIND-2** 🔴 `[repo]` `[deck]` `[angular.dev]` – Use `[style.prop]="val"` instead of `[ngStyle]`.

- Detect: `ngStyle`.
- Fix: `[style.color]="textColor"` / `[style.background-color]="bg"`; many props `[style]="{ … }"`. **auto**

**BIND-3** 🟡 `[repo]` – Inline `style="…"` only when the value is **computed/dynamic**
(e.g. `[style.--l-row-count]="rows()"`). Static inline styles belong in the component `.scss`.

- Detect: literal `style="…"` attributes in templates.
- Fix: move declarations into a (prefixed) class in the component stylesheet. Also a CSP concern –
  see [`ng-security`](../../ng-security/SKILL.md). **proposed** (needs a class name)

**BIND-4** 🟡 `[deck]` – For dynamic styling prefer binding a CSS **custom property**
(`[style.--gap.px]="gap()"`) over assembling style strings in TypeScript.

- Detect: component code building `style` strings / `Renderer2.setStyle` for theming.
- Fix: expose a custom property and bind it. **proposed**

> Attribute **ordering** for `[class.*]` / `[style.*]` is already enforced by ESLint
> (`@angular-eslint/template/attributes-order`); the audit defers to the linter for it.

---

## 2. View Encapsulation (`ENC`)

**ENC-1** 🟡 `[repo]` `[deck]` `[angular.dev]` – Default to `ViewEncapsulation.Emulated`: don't set
`encapsulation` at all unless there's a documented reason.

- Detect: `encapsulation:` in `@Component`.
- Fix: remove the override (Emulated is the default), or document why None/ShadowDom is needed. **proposed**

**ENC-2** 🔴 `[repo]` – A component using `ViewEncapsulation.None` **must** use the project prefix on
its selectors (so its now-global styles can't collide). The prefix does **not** apply to CSS custom
properties.

- Detect: components with `encapsulation: ViewEncapsulation.None` whose stylesheet has unprefixed
  element/class selectors.
- Fix: prefix the selectors (`.app-…` / the component element), keep custom properties unprefixed. **proposed**

**ENC-3** 🔵 `[deck]` – ShadowDom trade-offs: native scoping & better runtime, but **no global styles
reach in and design tokens may not pierce**. Flag ShadowDom on components that expect global theming.

- Detect: `ViewEncapsulation.ShadowDom` + reliance on global tokens/fonts.
- Fix: confirm the trade-off is intended; otherwise Emulated. **advisory**

**ENC-4** 🔵 `[angular.dev]` – Angular v22 adds `ViewEncapsulation.ExperimentalIsolatedShadowDom`;
note it as an option where stricter isolation is wanted (experimental). **advisory**

---

## 3. SCSS architecture & files (`SCSS`)

**SCSS-1** 🔴 `[repo]` `[deck]` – Component style belongs in the component's own `.scss`; global
styles are for **global concerns only**. Put styles locally; don't push component CSS to the global
sheet, and don't target a single component from global CSS.

- Detect: global rules scoped to one component; component `.scss` containing app-wide resets/utilities.
- Fix: relocate to the correct layer. **proposed**

**SCSS-2** 🔴 `[repo]` – Use `@use` / `@forward`, never the deprecated `@import`.

- Detect: `@import` in `*.scss`.
- Fix: convert to `@use` (with namespace) / `@forward`; update references. **auto** when the
  conversion is mechanical, **proposed** when namespacing changes call sites.

**SCSS-3** 🟡 `[repo]` – Organize global styles into partials in this layer order: **1** variables
(breakpoints, colors, sizes) · **2** libraries & helpers (CDK, Bootstrap) · **3** fonts · **4**
mixins · **5** objects · **6** variants.

- Detect: `src/styles/` / `src/styles.scss` structure vs the order above.
- Fix: split into partials and order them. **proposed**

**SCSS-4** 🟡 `[angular.dev]` – Co-locate a component's style file with its TS/HTML, share the **same
base name**, and use **kebab-case** (`user-profile.scss`). Extra style files append a descriptive
word (`user-profile-settings.scss`).

- Detect: style files placed apart from / named differently than the component.
- Fix: rename/move to match. **proposed**

**SCSS-5** 🟡 `[repo]` `[deck]` – Write **less & simple** SCSS, and **document** complex rules, hacks,
or workarounds with comments. (Document them – don't silently delete them.)

- Detect: dense/clever rules with no explanation; obvious dead rules.
- Fix: simplify and/or add an explanatory comment; remove only genuinely dead CSS. **proposed**

**SCSS-6** 🔵 `[deck]` – Be mindful of third-party stylesheets' impact on styling & performance; see
[`ng-performance`](../../ng-performance/SKILL.md). **advisory**

---

## 4. Design tokens (`TOKEN`)

**TOKEN-1** 🔴 `[repo]` – **No raw colors** (hex / `rgb()` / named) in component styles. Use a global
design token or a component-private custom property.

- Detect: color literals in component `.scss` (outside `:root`/token definitions).
- Fix: replace with `var(--t-…)`; define the token globally or on `:host`. **proposed**

**TOKEN-2** 🟡 `[repo]` – Global design tokens = **global** CSS custom properties; component-specific
knobs = custom properties on **`:host`**. Prefer tokens/knobs over repeated magic values.

- Detect: repeated literal values; component magic numbers that should be a `:host` knob.
- Fix: introduce a global token or a `:host` custom property. **proposed**

**TOKEN-3** 🟡 `[repo]` – Under `ViewEncapsulation.None`, the project prefix applies to selectors but
**not** to CSS custom properties.

- Detect: prefixed custom properties (`--app-…` where the convention is unprefixed tokens).
- Fix: align custom-property naming to the token convention. **proposed**

---

## 5. Selectors & nesting (`SEL`)

**SEL-1** 🔴 `[repo]` – Use **classes or element/component selectors**; avoid `#id` selectors.

- Detect: `#…` selectors in `*.scss`.
- Fix: convert to a class. **proposed**

**SEL-2** 🟡 `[repo]` – **BEM** with the project prefix: `.lxt-person` / `.lxt-person__head` /
`.lxt-person--tall`. There are **no nested BEM selectors**.

- Detect: unprefixed or non-BEM class naming; nested BEM.
- Fix: rename to BEM with prefix; flatten. **proposed**

**SEL-3** 🔴 `[repo]` – **Max 2 nesting levels** (rarely 3). `okay: .lxt-is-home .lxt-person`;
`no: body.lxt-is-home .lxt-person.lxt-is-disabled > .lxt-avatar`.

- Detect: nesting depth > 2 (3 only with justification).
- Fix: flatten using a **modifier** (`.lxt-avatar--disabled`). Specificity-affecting. **proposed**

**SEL-4** 🟡 `[repo]` – Avoid `&` to nest styles (hurts readability/greppability).

- Detect: `&` in selectors.
- Fix: write the full selector. **proposed**

**SEL-5** 🟡 `[repo]` – `dash-separated-lowercase` selector names (Prettier/convention).

- Detect: camelCase / PascalCase class names.
- Fix: rename to kebab-case. **proposed**

---

## 6. Forbidden constructs (`FORBID`)

**FORBID-1** 🔴 `[repo]` `[deck]` – **No `!important`.** ("What else is `!important`?")

- Detect: `!important`.
- Fix: remove and fix specificity properly (restructure the selector / token). Specificity-affecting. **proposed**

**FORBID-2** 🔴 `[repo]` – **No `::ng-deep`** (deprecated). Pierce with CSS custom properties instead.

- Detect: `::ng-deep`.
- Fix: expose a custom property the child reads, or restructure. **proposed**

**FORBID-3** 🔴 `[repo]` – **No `float`.** Use CSS grid or flexbox.

- Detect: `float:`.
- Fix: grid/flex layout. Layout-affecting. **proposed**

**FORBID-4** 🟡 `[repo]` – Avoid inline styles (CSP risk). Mirrors **BIND-3**; the write/CSP side is
[`ng-security`](../../ng-security/SKILL.md).

- Detect: literal `style="…"`.
- Fix: move to a class. **proposed**

**FORBID-5** 🔴 `[repo]` – **Don't reuse a library's own classes** (`.heading`, `.label`,
`.form-control`). Use prefixed classes; reference a lib class only to **override** its CSS. Overlaps
**FW-1**.

- Detect: bare library class names in templates/styles.
- Fix: wrap with a prefixed class. **proposed**

---

## 7. Units & values (`UNIT`)

**UNIT-1** 🟡 `[repo]` – Use `rem` for typography, not `px`.

- Detect: `px` on `font-size` / `line-height`.
- Fix: convert to `rem`. **proposed**

**UNIT-2** 🟡 `[repo]` – Zero values without a unit (`margin: 0`, not `0px`).

- Detect: `0px` / `0em` / `0rem`.
- Fix: drop the unit. **auto**

**UNIT-3** 🟡 `[repo]` – Explicit leading zero (`0.5em`, not `.5em`).

- Detect: `.5em` style values. (Prettier usually handles this.)
- Fix: add the leading `0`. **auto**

**UNIT-4** 🟡 `[repo]` – Prefer shorthand / intrinsic where useful (`margin: 1em auto`).

- Detect: longhand that could shorthand.
- Fix: shorthand. **proposed**

**UNIT-5** 🟡 `[repo]` – Prefer **CSS logical properties** (`margin-inline-start`) over physical
(`margin-left`).

- Detect: physical inset/margin/padding/border properties.
- Fix: logical equivalents. **proposed**

**UNIT-6** 🟡 `[repo]` – Use `:has()` for parent/sibling state styling instead of JS-toggled classes
where possible.

- Detect: classes toggled in TS purely to style an ancestor/sibling.
- Fix: replace with a `:has()` rule. **proposed**

---

## 8. Framework-class leakage (`FW`)

**FW-1** 🔴 `[repo]` `[deck]` – **Avoid using component-framework classes directly.** Don't author
Material/PrimeNG/Bootstrap class names into your templates or stylesheets; wrap with a prefixed
class. Reference a framework class only to override it.

- Detect: framework class names (`mat-…`, `p-…`, `ant-…`, Bootstrap utilities) in your templates/scss.
- Fix: introduce a prefixed wrapper class. **proposed**

**FW-2** 🟡 `[deck]` – Customize a framework through **its theming system** (and Material SCSS
variables), not by overriding internals ad hoc. See
[component-frameworks.md](component-frameworks.md).

- Detect: deep overrides of framework internals / `::ng-deep` into framework components.
- Fix: move customization into the framework's theming API. **proposed**

**FW-3** 🔵 `[deck]` – Heavy framework customization is a _difficult endeavour_; if you're fighting
it, an **own design system** may fit better. **advisory**

---

## Advisory (`ADV`) – opportunities, never auto-applied

**ADV-1** 🔵 `[deck]` – Use **`inject(DOCUMENT)`** for SSR-safe `document` access (scroll position,
body class) instead of the global `document`.

- Detect: direct `document.` references in components/services.
- Suggest: `private readonly document = inject(DOCUMENT);`. The _write_ side (sanitization, raw DOM)
  is [`ng-security`](../../ng-security/SKILL.md)'s concern – note the tension, don't "fix" blindly.

**ADV-2** 🔵 `[deck]` `[angular.dev]` – **NG17 view transitions**: enable with
`provideRouter(routes, withViewTransitions())`; put `::view-transition-old/new` and
`view-transition-name` CSS in **global** styles (encapsulation would scope it away). Pair reduced-
motion with [`ng-accessibility`](../../ng-accessibility/SKILL.md).

**ADV-3** 🔵 `[deck]` – **Design-system best practices**: Tailwind CSS, the Material **CDK** for
accessibility, **Storybook** for docs/testing, **Standalone + OnPush**, and `ViewEncapsulation.None`
for a design-system library. See [component-frameworks.md](component-frameworks.md).

**ADV-4** 🔵 `[deck]` – **Consider adding Stylelint** (Prettier is already required) to make the
mechanical SCSS rules above deterministically enforceable. This skill does not require it.
