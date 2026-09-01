# Component frameworks, design systems & advisories

The advisory layer: framework customization and the deck's adoption topics. None of this is a
pass/fail violation – it's reported as 🔵 opportunities and never auto-applied. Rule ids point back
to [styling-checklist.md](styling-checklist.md).

## Component frameworks (`FW-*`)

Detect the heavy-CSS frameworks from `package.json` before auditing: the rules below are written for
**ag-grid** (community + enterprise), **@ng-select/ng-select**, and **@spartan-ng/** primitives, and
apply only to the ones actually installed. (The deck also surveys Angular Material, PrimeNG,
NG-ZORRO, Clarity, and Canopy – treat those as a **generic aside** unless `package.json` lists them.)

**Don't leak their classes (`FW-1`, `FORBID-5`).** Authoring `.ag-…` (ag-grid) or `.ng-select` /
`.ng-…` (ng-select) – or, for the aside frameworks, `mat-…`, `p-…`, `ant-…`, or Bootstrap utility
classes – directly into your templates/styles couples you to the framework's internals and breaks
on upgrades. Wrap with a **prefixed** class of your own; reference a framework class only when you
are deliberately overriding its CSS.

**Customize through the framework, not around it (`FW-2`).** Framework customization is _a difficult
endeavour_ – and how much is possible depends on the framework.

- **Theming first** – use the framework's own theming surface: ag-grid's CSS-variable theming
  (`--ag-*` custom properties / theming API), ng-select's documented SCSS/CSS-variable overrides,
  and spartan's Helm layer + Tailwind tokens. When you add custom component styles, do it via
  **global SCSS or component styling (mind encapsulation!)** and **integrate with the framework's
  own variables** rather than hand-rolling values. Extending a framework's components is preferable
  to overriding their internals. (Same holds for an aside framework like Angular Material: use its
  theming guide and Material's SCSS variables.)
- **Limit customization** to what the framework supports cleanly. Reaching past the public theming
  API (e.g. `::ng-deep` into a framework component – `FORBID-2`) is a smell.
- **3rd-party** – explore libraries/tools that _complement_ the framework before fighting it.

**When customization becomes a fight (`FW-3`)** – if you're constantly overriding internals, a
**own design system** may fit better than bending someone else's.

## Building your own design system (`ADV-3`)

The deck's recommended best practices for a design-system library (e.g. like **Canopy**), taking
inspiration from the frameworks above:

- **Tailwind CSS** for utility-driven styling.
- **Semantic HTML** elements (`button`, `input`, …) **+ the Material CDK** for accessibility
  primitives (overlay, a11y, focus) without the full Material look. Pair with
  [`ng-accessibility`](../../ng-accessibility/SKILL.md).
- **`ViewEncapsulation.None`** for the design-system library so consumers can style it – with the
  prefix discipline of `ENC-2`.
- **Storybook** for documentation and visual testing.
- **Standalone components on the default `OnPush` change detection** (v22+; never set it explicitly, never opt into `Eager`) – see
  [`ng-performance`](../../ng-performance/SKILL.md).

If the project already builds on a lightweight primitive layer, prefer
[`spartan`](../../spartan/SKILL.md) (spartan/ui – Brain + Helm) over a heavy component framework.

## `inject(DOCUMENT)` for SSR-safe DOM access (`ADV-1`)

The deck files this under styling because the common cases are visual – scroll-to-top, toggling a
body class. Use the **`DOCUMENT` token** so the code is SSR-safe and testable:

```typescript
private readonly document = inject(DOCUMENT);

// get body
const body = this.document.getElementsByTagName('body')[0];
// scroll to top
this.document.documentElement.scrollTop = 0;
```

> Tension to respect: [`ng-security`](../../ng-security/SKILL.md) says **avoid raw DOM access**
> because it bypasses Angular's sanitization. These don't conflict – `inject(DOCUMENT)` is about
> _how_ to reach `document` safely under SSR; sanitization governs _what_ you may write to it. Flag
> `document.` usage as an advisory to switch to the token, but don't "fix" DOM **writes** here –
> hand those to `ng-security`.

## Consider Stylelint (`ADV-4`)

This skill enforces by **reasoning**, not by a linter, and adds no dependency. But the deck pairs
**Prettier & Stylelint** under (S)CSS Architecture for a reason: a Stylelint config would make many
mechanical rules in [styling-checklist.md](styling-checklist.md) – nesting depth (`SEL-3`),
`declaration-no-important` (`FORBID-1`), property order, `no-invalid-position-at-import-rule`,
unitless zero (`UNIT-2`) – **deterministically enforced in CI** instead of re-reasoned each run.

Report it as an opportunity. If the user opts in, a config mapped to the `[repo]` SCSS guide
(`max-nesting-depth: 2`, `declaration-no-important: true`, BEM selector pattern with the project
prefix, `@use`/`@forward` over `@import`) is the natural starting point – but introducing it is a
separate, explicit decision, not part of an audit run.
