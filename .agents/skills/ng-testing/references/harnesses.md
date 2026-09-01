# Component harnesses (CDK) + a spartan-ng example

A **CDK component harness** is a class that wraps a component's DOM and exposes a task-level API
(`click()`, `getValue()`, `isChecked()`) instead of raw selectors. Prefer it over
`fixture.nativeElement.querySelector(...)` because a harness:

- **survives DOM restructuring** – tests break only when behavior changes, not markup,
- **auto-runs change detection** and waits for async work between actions, and
- is **reusable** across every spec (and shareable as a component's public test API).

APIs below are verified against `@angular/cdk` 22 (`@angular/cdk/testing`,
`@angular/cdk/testing/testbed`).

## Loading a harness in a TestBed spec

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

const fixture = TestBed.createComponent(HostComponent);
const loader = TestbedHarnessEnvironment.loader(fixture);

const button = await loader.getHarness(ButtonHarness); // first match
const all = await loader.getAllHarnesses(ButtonHarness); // every match
```

- `loader(fixture)` searches inside the fixture's root element.
- `documentRootLoader(fixture)` searches the whole document – use it for overlays (dialogs, menus,
  tooltips) that render outside the component, e.g. spartan/CDK overlays.
- `getHarnessOrNull(...)` returns `null` instead of throwing when absent.

## Writing a custom harness

Extend `ComponentHarness`, set a static `hostSelector`, and build the API from `host()` /
`locatorFor(...)`, which return `TestElement`s (`click`, `text`, `getAttribute`, `hasClass`,
`getProperty`, `sendKeys`, `isFocused`, …). Example for this repo's `button[lxt-button]`:

```ts
import { ComponentHarness } from '@angular/cdk/testing';

export class ButtonHarness extends ComponentHarness {
  static hostSelector = 'button[lxt-button]';

  async click(): Promise<void> {
    return (await this.host()).click();
  }
  async text(): Promise<string> {
    return (await this.host()).text();
  }
  async isDestructive(): Promise<boolean> {
    return (await this.host()).hasClass('destructive');
  }
}
```

```ts
const button = await loader.getHarness(ButtonHarness);
expect(await button.isDestructive()).toBe(true);
await button.click();
```

To filter multiple instances by content, add a static `with(options)` returning a
`HarnessPredicate<ButtonHarness>`, then `getHarness(ButtonHarness.with({ text: 'Save' }))`.

## spartan-ng example

spartan **Brain** primitives are headless directives that render native elements (`@spartan-ng/brain`
is installed here), so a harness targets the host they attach to and asserts observable state via
attributes/properties. Example for a Brain switch (`brn-switch`, backed by `role="switch"` +
`aria-checked`):

```ts
import { ComponentHarness } from '@angular/cdk/testing';

export class BrnSwitchHarness extends ComponentHarness {
  static hostSelector = 'brn-switch';

  private async control(): Promise<import('@angular/cdk/testing').TestElement> {
    return this.locatorFor('[role="switch"]')();
  }
  async isChecked(): Promise<boolean> {
    return (await this.control()).getAttribute('aria-checked').then((v) => v === 'true');
  }
  async toggle(): Promise<void> {
    return (await this.control()).click();
  }
}
```

```ts
const toggle = await loader.getHarness(BrnSwitchHarness);
expect(await toggle.isChecked()).toBe(false);
await toggle.toggle();
expect(await toggle.isChecked()).toBe(true);
```

Assert on **roles and ARIA state** (what a user and assistive tech observe), never on
`ng-reflect-*` or `_ngcontent-*` – those are dev/build-only and vanish in production. Confirm the
exact host selector and ARIA surface against the installed spartan version before writing (the
spartan skill and MCP tools can supply it).
