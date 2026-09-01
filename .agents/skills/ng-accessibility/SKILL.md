---
name: ng-accessibility
description: Make an Angular (v17+) application accessible – semantic HTML, keyboard & focus, color contrast, text alternatives, accessible forms & tables, plus Angular-specific tooling (ARIA attribute bindings, CDK a11y LiveAnnouncer/cdkTrapFocus, Angular Aria & Material, accessible custom components, router titles/active-links/focus management). Use when the user wants to improve accessibility/a11y, meet WCAG AA, fix screen-reader or keyboard issues, pass axe/Lighthouse a11y audits, or asks for an accessibility review. Covers the angular.dev a11y best practices.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular Accessibility (a11y)

A practical guide to building Angular apps everyone can use. Two layers: **WCAG fundamentals**
(the HTML/CSS you author) and **Angular tooling & patterns** (CDK, Aria, router, custom components).
Target is **WCAG 2.x AA**.

> Targets Angular v17+ (standalone + signals). Accessibility is a requirement, not a polish step –
> build it in from the first component.

## 0. Verify – don't assume

a11y can't be eyeballed. Run all four:

- **Automated:** axe DevTools (or Lighthouse a11y audit) – catches ~30–50% of issues. Check for a `playwright.config.ts` first (the workshop's teaching branches gain Playwright later); once it exists, bake AXE checks into the e2e suite via `@axe-core/playwright` and run them against key views – see the create-e2e-tests skill for scaffolding Playwright and wiring assertions into a spec.
- **Keyboard-only:** unplug the mouse. Tab through everything; every interactive element must be reachable, operable, and have a **visible focus** indicator.
- **Screen reader:** VoiceOver (macOS), NVDA (Windows), or TalkBack.
- **Lint:** enable `@angular-eslint` accessibility template rules (alt-text, label-has-associated-control, click-events-have-key-events, valid-aria, etc.) to catch issues at author time.

---

## Part 1 – WCAG Fundamentals

> These are the web-a11y basics you author in HTML/CSS – kept terse here. For the project's
> house rules and do/don't lists, see [style-guide.a11y.md](../../../style-guide/style-guide.a11y.md).

### 1.1 Semantic HTML & structure

Native elements carry meaning and behavior for free: use landmarks (`<header>`, `<nav>`, `<main>`,
`<aside>`, `<article>`, `<footer>`), one logical heading order (`<h1>`→`<h6>`), and reach for a
`<div>`/`<span>` only when no semantic element fits.

### 1.2 Keyboard access & focus (WCAG 2.1, 2.4)

- Everything operable by mouse must be operable by keyboard, in a sensible **tab order**.
- `tabindex` may be `"0"` (in natural order) or `"-1"` (focusable only programmatically). **Never use `tabindex > 0`.**
- **Focus must be clearly visible** – style `:focus`/`:focus-visible` (≥2px, ideally 3px, with contrast). Never `outline: none` without a replacement.
- Provide a **skip link** to jump past repeated navigation to `<main>`.
- **`<a>` vs `<button>`:** links navigate (have an `href`/`routerLink`); buttons perform actions. Don't fake either with a `<div>` + click handler.

### 1.3 Color & contrast (WCAG 1.4.1, 1.4.3)

Never use color as the **only** signal (error = red text only) – add an icon, text, or shape. Keep
contrast ≥ **4.5:1** for body text, **3:1** for large text/UI. Check with [whocanuse.com](https://www.whocanuse.com/).

### 1.4 Text alternatives (WCAG 1.1)

Give images/icons a descriptive `alt` that conveys purpose, not appearance; use `alt=""` (plus
`aria-hidden="true"` for icon fonts/SVGs) for purely decorative graphics.

### 1.5 Forms (WCAG 1.3.1, 3.3)

- Every control needs a programmatic **`<label for>`** (or `aria-label`/`aria-labelledby`).
- Group related controls with **`<fieldset>` + `<legend>`**.
- Mark required fields (`required` / `aria-required`), and surface errors with **`aria-invalid`** and **`aria-describedby`** pointing at the message – clear, understandable, and helpful.

```html
<label for="from">From (*)</label>
<input
  id="from"
  name="from"
  type="text"
  required
  [attr.aria-invalid]="ctrl.dirty && ctrl.invalid"
  [attr.aria-describedby]="ctrl.dirty && ctrl.invalid ? 'from_errors' : null"
/>
@if (ctrl.dirty && ctrl.invalid) {
<app-validation-errors id="from_errors" [errors]="ctrl.errors" fieldLabel="From" />
}
```

### 1.6 Tables (WCAG 1.3.1, 2.4.6)

Use real `<table>` structure: `<thead>`/`<tbody>`, `<th scope="col|row">`, a `<caption>` for the
topic, and `aria-describedby` for longer orientation. If you can't use a native table, replicate the
roles (`role="table|row|columnheader|rowheader"`).

```html
<p id="tableDesc">Column one lists location & size; other columns show type and count.</p>
<table aria-describedby="tableDesc">
  <caption>
    Availability of holiday accommodation
  </caption>
  <thead>
    <tr>
      <td></td>
      <th scope="col">Studio</th>
      <th scope="col">Chalet</th>
    </tr>
  </thead>
  <tbody>
    <!-- … -->
  </tbody>
</table>
```

### 1.7 Other essentials

Media (1.2): transcripts/captions. Resizable text (1.4.4): size in **`rem`**, works at 200% zoom.
Tap targets (2.5.5/2.5.8): ≥ **24×24** CSS px (aim for 44×44). Language (3.1): set `<html lang="…">`.

---

## Part 2 – Angular Tooling & Patterns

### 2.1 ARIA attribute bindings

Bind dynamic ARIA with attribute binding so it stays in sync; static ARIA is plain HTML.

```html
<button aria-label="Save">…</button>
<!-- static -->
<button [attr.aria-label]="actionLabel()">…</button>
<!-- dynamic -->
```

Use `[attr.aria-*]` (not `[aria-*]`) for ARIA – they're attributes, not DOM properties.

### 2.2 Angular CDK a11y package

`@angular/cdk/a11y` provides building blocks:

- **`LiveAnnouncer`** – announce dynamic changes (errors, async results) to screen readers via an `aria-live` region.
- **`cdkTrapFocus`** – trap Tab focus inside modals/dialogs/menus so it can't escape to the page behind.

```ts
private readonly liveAnnouncer = inject(LiveAnnouncer);
this.liveAnnouncer.announce('Flights loading error');
```

```html
<div class="gdpr-dialog" cdkTrapFocus><!-- focus stays inside --></div>
```

(CDK also offers `FocusMonitor`, `FocusKeyManager`, `cdkAriaLive`, and high-contrast helpers.)

### 2.3 Angular Aria & Material (and other design systems)

- **Angular Material** is a fully accessible component suite – prefer it for common UI; if you build your own design system, mirror (or fork) its patterns.
- **Angular Aria (`@angular/aria`)** – _experimental, not installed by default (`install @angular/aria` first)._ Headless directives (accordion, combobox, listbox, menu, menubar, tabs, toolbar, tree, grid…) that handle keyboard interaction, ARIA, focus, and screen-reader support while you supply the styling. Ideal for custom-styled but accessible components.
- **spartan/ui (`@spartan-ng`)** – check `package.json` for `@spartan-ng/*` before recommending it; headless, accessible primitives that pair with CDK/Aria and let you own the styling.
- Other accessible systems pair well with CDK/Aria: **PrimeNG, NG-Zorro, Clarity**.

### 2.4 Authoring accessible components

**Augment native elements** – don't reinvent `<button>`/`<a>`. Use an **attribute selector** on a
component that wraps the native element, preserving its built-in behavior (the `MatButton` pattern):

```ts
@Component({ selector: 'button[appButton], a[appButton]', /* … */ })
```

**Use containers when a native element needs wrapping** – e.g. `<input>` can't have children, so
project it through your component's API (the `MatFormField` pattern) instead of recreating the input.

**Custom interactive components** – set `role`, ARIA state, and labels via the **`host` object**
(this repo forbids `@HostBinding`/`@HostListener`):

```ts
@Component({
  selector: 'app-slider',
  host: {
    'role': 'slider',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-label]': 'label()',
    'tabindex': '0',
  },
})
```

### 2.5 Router accessibility

**Unique page titles** – every route gets a `title`; centralize a suffix with a `TitleStrategy`:

```ts
{ path: 'home', component: Home, title: 'Home' }   // → "Home – Demo"

export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  updateTitle(state: RouterStateSnapshot) {
    const t = this.buildTitle(state);
    this.title.setTitle(t ? `${t} – Demo` : 'Demo');
  }
}
```

**Active link identification** – `RouterLinkActive` + `ariaCurrentWhenActive` sets `aria-current="page"`:

```html
<a routerLink="home" routerLinkActive="active" ariaCurrentWhenActive="page">Home</a>
```

**Focus management after navigation** – SPA route changes don't move focus, leaving it on `<body>`.
On `NavigationEnd`, move focus to the main content (use judiciously – don't disorient users). Note:
`<main>` is non-interactive, so `.focus()` is a silent no-op unless it carries `tabindex="-1"` –
author `<main tabindex="-1">` (or set the attribute before focusing):

```ts
inject(Router)
  .events.pipe(
    filter((e) => e instanceof NavigationEnd),
    takeUntilDestroyed(),
  )
  .subscribe(() => {
    const main = document.querySelector('main');
    main?.setAttribute('tabindex', '-1'); // <main> is non-interactive; needed for .focus()
    (main as HTMLElement | null)?.focus();
  });
```

### 2.6 Deferred content & live regions

`@defer` swaps content in after load – wrap it in an `aria-live` region so screen-reader users are
notified when lazy content appears:

```html
<div aria-live="polite">
  @defer (on viewport) { <app-comments /> } @placeholder {
  <p>Loading comments…</p>
  }
</div>
```

---

## Quick checklist

**Fundamentals**

- [ ] Semantic landmarks + ordered headings; `<a>` for navigation, `<button>` for actions
- [ ] Full keyboard operability, sane tab order, **visible focus**, skip link
- [ ] Contrast ≥4.5:1 (3:1 large); never color-only signals
- [ ] Meaningful `alt` (or `alt=""` + `aria-hidden` for decorative)
- [ ] Labeled form controls; `aria-invalid` + `aria-describedby` for errors
- [ ] Real table structure: `<caption>`, `scope`, `th`
- [ ] Captions/transcripts; `rem` sizing (works at 200% zoom); ≥24px targets; `<html lang>`

**Angular**

- [ ] Dynamic ARIA via `[attr.aria-*]`
- [ ] `LiveAnnouncer` for async messages; `cdkTrapFocus` in dialogs/menus
- [ ] Prefer Material / Angular Aria; augment native elements (attribute selectors)
- [ ] Custom components expose `role` + ARIA via the `host` object and accept a label
- [ ] Unique route `title`s; `ariaCurrentWhenActive`; focus to `<main>` on navigation
- [ ] `aria-live` around `@defer`
- [ ] axe + keyboard + screen-reader pass; `@angular-eslint` a11y rules on

## References

- This project – [a11y style guide](../../../style-guide/style-guide.a11y.md) (house rules, do/don't, zero-AXE target)
- Angular – [Accessibility best practices](https://angular.dev/best-practices/a11y)
- Angular CDK – [a11y package](https://material.angular.dev/cdk/a11y/overview) · Angular Material – [material.angular.dev](https://material.angular.dev)
- Angular Aria – `@angular/aria` headless directives (experimental; `install @angular/aria` first)
- W3C – [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- web.dev – [Learn Accessibility](https://web.dev/learn/accessibility) · Contrast checker – [whocanuse.com](https://www.whocanuse.com/)
