# Playwright e2e for Angular components

Platform guide for [create-e2e-tests](../SKILL.md). It covers Playwright-specific setup, file layout, spec structure, and Angular-aware patterns. The shared selector ladder, self-test, and assertion rules live in the [SKILL](../SKILL.md#rules-both-guides-obey) – this guide shows their Playwright syntax.

Playwright drives the rendered DOM, not Angular. Test what the user sees; never reach into the framework runtime.

## Contents

- [Setup](#setup)
- [File layout and naming](#file-layout-and-naming)
- [Spec structure](#spec-structure)
- [Locators](#locators)
- [Reactive forms](#reactive-forms)
- [CDK overlays and Angular Material](#cdk-overlays-and-angular-material)
- [Signals and observables](#signals-and-observables)
- [Zone.js and zoneless](#zonejs-and-zoneless)
- [Accessibility (opt-in)](#accessibility-opt-in)
- [Anti-patterns](#anti-patterns)
- [Running](#running)
- [Checklist](#checklist)

## Setup

Run only when Playwright is not yet configured (step 3 of the SKILL):

```bash
pnpm create playwright
```

### `playwright.config.ts`

Point `baseURL` at the user-started server. Configure managed `webServer` startup only after explicit authorization. Use the dev server locally and a production build in CI – the prod build catches production-only bugs the dev server hides.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer:
    process.env['PLAYWRIGHT_START_SERVER'] === '1'
      ? {
          command: 'pnpm start',
          url: 'http://localhost:4200',
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
        }
      : undefined,
});
```

The opt-in flag is an explicit serving decision; the agent must not set it to bypass the project’s approval rule. Check the actual scripts and URL. In CI, configure the approved server command for the built application and pin any serving dependency. In an Nx workspace, use the installed Nx integration and retain the same ownership rule.

## File layout and naming

```text
e2e/
└── <component-name>.spec.ts   # one spec per component, under testDir
```

Name the spec after the component (`select.spec.ts`). Unit specs are also `*.spec.ts` but are co-located with their source; e2e specs are distinguished by living under `testDir` (`./e2e`). Detect the real `testDir` from `playwright.config.ts` before writing.

## Spec structure

One `test.describe` per spec. Open with the self-test, navigate in `beforeEach`, then test behavior.

```ts
import { test, expect } from '@playwright/test';

test.describe('Select e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select'); // ROUTE from step 4
  });

  // self-test: did the route load and is the component on screen?
  test('renders the component (self-test)', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Country' })).toBeVisible();
  });

  test('selects an option by its visible label', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Country' }).click();
    await page.getByRole('option', { name: 'Austria' }).click();
    await expect(page.getByRole('combobox', { name: 'Country' })).toContainText('Austria');
  });
});
```

## Locators

Apply the [selector ladder](../SKILL.md#selector-ladder). In Playwright:

```ts
// 1. user-facing (preferred)
await page.getByRole('button', { name: 'Create project' }).click();
await page.getByLabel('Project name').fill('My Project');
await expect(page.getByText('3 projects total')).toBeVisible();

// 2. component host / form control – rarely needed; prefer rendered content
// 3. documented test hook, for components with no semantic role
await expect(page.getByTestId('revenue-chart')).toBeVisible();
```

Scope locators to a region to disambiguate repeated elements:

```ts
const userTable = page.getByRole('table', { name: 'Users' });
const adminRow = userTable.getByRole('row').filter({ has: page.getByRole('cell', { name: 'Admin' }) });
await adminRow.getByRole('button', { name: 'Edit' }).click();
```

Never target `[_ngcontent-*]`, `[ng-reflect-*]`, component selectors as a content proxy, or Material `.mat-*` classes – see [anti-patterns](#anti-patterns).

## Reactive forms

Drive validation through user interaction (fill, blur, check), then assert the rendered messages and control state – not the `FormGroup` internals.

```ts
test('shows validation errors and gates the submit button', async ({ page }) => {
  await page.goto('/register');

  const email = page.getByLabel('Email');
  await email.click();
  await email.blur();
  await expect(page.getByText('Email is required')).toBeVisible();

  await email.fill('not-an-email');
  await email.blur();
  await expect(page.getByText('Invalid email format')).toBeVisible();

  const submit = page.getByRole('button', { name: 'Create account' });
  await expect(submit).toBeDisabled();

  await email.fill('jane@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass');
  await expect(submit).toBeEnabled();
});
```

A dynamic `FormArray` is tested through the buttons that mutate it and the resulting control count:

```ts
await page.getByRole('button', { name: 'Add phone number' }).click();
await expect(page.getByLabel(/Phone number/)).toHaveCount(2);
```

## CDK overlays and Angular Material

Angular CDK renders overlays (dialogs, menus, selects, autocompletes) into a container outside the component tree. Playwright sees them as ordinary DOM – no special handling, just role-based locators. Angular Material is one such consumer:

```ts
// mat-select exposes role="combobox"; its options render in a CDK overlay
await page.getByRole('combobox', { name: 'Theme' }).click();
await page.getByRole('option', { name: 'Dark' }).click();
await expect(page.getByRole('combobox', { name: 'Theme' })).toContainText('Dark');

// MatDialog renders with role="dialog"
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();
await dialog.getByRole('button', { name: 'Cancel' }).click();
await expect(dialog).toBeHidden();
```

The same `getByRole('dialog' | 'menu' | 'listbox')` approach works for any overlay, Material or custom.

## Signals and observables

Test reactive state **indirectly**, through the DOM it renders. Playwright's auto-waiting assertions retry until change detection has run, so signals and zoneless apps need no special waits.

```ts
// signal-based counter
await expect(page.getByTestId('count')).toHaveText('0');
await page.getByRole('button', { name: 'Increment' }).click();
await expect(page.getByTestId('count')).toHaveText('1');

// debounced search observable – assert the batched effect, not the stream
const calls: string[] = [];
await page.route('**/api/search*', (route) => {
  calls.push(route.request().url());
  return route.continue();
});
await page.getByRole('textbox', { name: 'Search' }).pressSequentially('angular', { delay: 50 });
await expect(page.getByRole('listitem')).toHaveCount(5);
expect(calls.length).toBeLessThanOrEqual(2); // debounceTime batched the keystrokes
```

## Zone.js and zoneless

Playwright does not depend on Zone.js – it waits for DOM changes, not change-detection ticks. After an interaction, a web-first assertion (`await expect(locator).toHaveText(...)`) retries until the DOM updates. This works identically in zoneless apps and with long-running `setInterval`/observables. There is no `browser.waitForAngular()` and none is needed – delete that Protractor habit.

## Accessibility (opt-in)

Add an axe scan when the user asks or when a component's accessibility behavior is under test (see the [a11y style guide](../../../../style-guide/style-guide.a11y.md)). Install `@axe-core/playwright`:

```ts
import AxeBuilder from '@axe-core/playwright';

test('has no accessibility violations', async ({ page }) => {
  await page.goto('/select');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Anti-patterns

| Don't                                         | Why                                                     | Do instead                                                  |
| --------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `page.locator('[_ngcontent-abc]')`            | Scoped-style attributes are random and change per build | `getByRole` / `getByLabel` / `getByText` / `getByTestId`    |
| `page.locator('[ng-reflect-model="x"]')`      | `ng-reflect-*` is dev-only, stripped in production      | Assert the rendered value: `expect(input).toHaveValue('x')` |
| `page.locator('app-my-component')` as a proxy | Component selectors are implementation details          | Target the content the component renders                    |
| `page.locator('.mat-mdc-button')`             | Material class names change between versions            | `getByRole('button', { name: 'Submit' })`                   |
| `page.evaluate(() => (window as any).ng)`     | Depends on debug mode; absent in production builds      | Test through the DOM; never touch the Angular runtime       |
| `page.waitForTimeout(500)` after an action    | Change-detection timing varies; arbitrary waits flake   | `await expect(locator).toHaveText('...')` auto-retries      |
| `browser.waitForAngular()`                    | Protractor-ism; does not exist in Playwright            | Remove it; web-first assertions wait for you                |
| `ng serve` in CI                              | Slower, ships debug code, hides production-only bugs    | `ng build && http-server -s` in CI                          |

## Running

Use the commands resolved in [SKILL step 2](../SKILL.md#2-resolve-the-projects-commands). Use the running app unless managed startup was explicitly authorized.

```bash
# Nx
nx e2e <app>-e2e e2e/select.spec.ts

# Angular CLI / plain Playwright
pnpm exec playwright test e2e/select.spec.ts

# debug a single spec
pnpm exec playwright test e2e/select.spec.ts --headed --debug

# scaffold a spec interactively against the running app
pnpm exec playwright codegen http://localhost:4200
```

## Checklist

- [ ] Spec is `<component>.spec.ts` under the detected `testDir`
- [ ] Opens with a self-test (component visible) and tests real behavior
- [ ] Locators follow the ladder (`getByRole` first); no `_ngcontent`/`ng-reflect`/`.mat-*`
- [ ] No `waitForTimeout`; assertions are web-first (`await expect(...)`)
- [ ] Reactive state tested through the DOM, not the runtime
- [ ] Spec run green, or stopped with a clear report
