# Cypress e2e for Angular components

Platform guide for [create-e2e-tests](../SKILL.md). It covers Cypress-specific setup, file layout, spec structure, custom commands, fixtures, and running. The shared selector ladder, self-test, and assertion rules live in the [SKILL](../SKILL.md#rules-both-guides-obey) – this guide shows their Cypress syntax.

## Contents

- [Setup](#setup)
- [File layout and naming](#file-layout-and-naming)
- [Spec structure](#spec-structure)
- [Selectors](#selectors)
- [Interactions](#interactions)
- [Custom commands](#custom-commands)
- [Fixtures](#fixtures)
- [Accessibility (opt-in)](#accessibility-opt-in)
- [Running](#running)
- [Checklist](#checklist)

## Setup

Run only when Cypress is not yet configured (step 3 of the SKILL). Install Cypress plus the recommended helpers (use the project's package manager):

```bash
pnpm add -D cypress @testing-library/cypress cypress-real-events
# optional, for one-shot/CI runs that boot the app first:
pnpm add -D start-server-and-test
```

- `@testing-library/cypress` – adds `cy.findByRole` / `cy.findByLabelText`, so Cypress honours the role/label rungs of the selector ladder.
- `cypress-real-events` – adds `.realHover()`, `.realClick()`, `.realPress()` for true native hover/focus/keyboard events (Cypress's synthetic events do not trigger CSS `:hover` / `:focus`).

### `cypress.config.ts`

Keep it minimal and portable. Point `baseUrl` at the app's dev-server URL, fix the viewport for determinism.

```ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 960,
    // testIsolation defaults to `true` (each test starts from a clean slate).
    // Set it to `false` only as a deliberate speed trade-off for a read-only
    // showcase app – then every test must still set up what it needs.
  },
});
```

In an Nx workspace, generate the project with `nx g @nx/cypress:configuration` instead and let it wire `cypress.config.ts` + `project.json`; the body above still applies.

### `cypress/support/e2e.ts`

Loaded automatically before every spec. Register the helpers and your custom-command files here:

```ts
import '@testing-library/cypress/add-commands';
import 'cypress-real-events';
// one import per custom-command file you add:
// import './commands/select-commands';
```

### Page objects (optional)

A page object is just a tiny module of selector helpers – reach for one when a selector is shared across specs:

```ts
// cypress/support/page-objects/app.po.ts
export const getHeading = (): Cypress.Chainable<JQuery<HTMLHeadingElement>> => cy.get('h1');
```

## File layout and naming

```text
cypress/
├── e2e/                       # spec files
│   └── <component-name>.cy.ts # one spec per component, MUST end in .cy.ts
├── fixtures/                  # static JSON test data
└── support/
    ├── e2e.ts                 # global setup + imports
    ├── commands/              # custom commands, grouped by feature
    └── commands.d.ts          # types for every custom command
```

Detect the real spec directory first – plain Cypress uses `cypress/e2e/`, an Nx project uses `<app>-e2e/src/e2e/`. Name the spec after the component (`select.cy.ts`), and name the `describe` block `'<ComponentName> e2e'`.

## Spec structure

One `describe` per spec. Open with the self-test, then test behavior in the order a user would interact. Alias the instances you address repeatedly.

```ts
import { getHeading } from '../support/page-objects/app.po';

describe('Select e2e', () => {
  beforeEach(() => {
    cy.visit('/select'); // ROUTE from step 4
    cy.get('app-select').first().as('select'); // alias for repeated use
  });

  // self-test: did the route load and is the component on screen?
  it('renders the component (self-test)', () => {
    cy.get('app-select').should('have.length.at.least', 1);
  });

  it('selects an option by its visible label', () => {
    cy.get('@select').findByRole('combobox').click();
    cy.findByRole('option', { name: 'Austria' }).click();
    cy.get('@select').findByRole('combobox').should('contain.text', 'Austria');
  });
});
```

Aliases (`.as('select')` + `cy.get('@select')`) keep selectors out of every assertion and survive DOM re-renders.

## Selectors

Apply the [selector ladder](../SKILL.md#selector-ladder). In Cypress:

```ts
// 1. user-facing (preferred) – via @testing-library/cypress
cy.findByRole('combobox', { name: /country/i });
cy.findByLabelText('Email').type('a@b.c');

// 2. component host / form control
cy.get('app-select');
cy.get('[formcontrolname="country"]');

// 3. documented test hook
cy.get('[data-testid="country-select"]');

// 4. framework internals – last resort, and only inside a custom command
```

Never assert on `_ngcontent-*` / `ng-reflect-*`. When you must touch a library's internal class (e.g. a third-party dropdown panel) because it exposes no public hook, isolate that knowledge in a [custom command](#custom-commands) so it lives in exactly one place.

## Interactions

Use `cypress-real-events` whenever the behavior under test depends on real hover, focus, or keyboard events:

```ts
cy.findByRole('button', { name: 'Help' }).realHover();
cy.findByRole('tooltip').should('be.visible');

cy.get('@select').findByRole('combobox').realClick();
cy.realPress('ArrowDown');
cy.realPress('Enter');
```

For assertions, lean on Cypress retry-ability – chain `.should()` / `.and()` rather than `cy.wait(<ms>)`. Cypress retries the whole command-query chain until the assertion passes or the timeout elapses.

## Custom commands

Lift a DOM sequence into a custom command when the **same dance repeats in two or more places**. Name it after user intent (`pickOption`), not the DOM call (`clickFirstLi`).

1. Add it in a feature file under `support/commands/`:

   ```ts
   // support/commands/select-commands.ts
   Cypress.Commands.add('pickOption', { prevSubject: 'element' }, (subject: JQuery<HTMLElement>, label: string) => {
     cy.wrap(subject).findByRole('combobox').click();
     cy.findByRole('option', { name: label }).click();
   });
   ```

2. Register the file in `support/e2e.ts` (`import './commands/select-commands';`).
3. Type it in `support/commands.d.ts` so strict TypeScript and autocomplete keep working:

   ```ts
   declare global {
     namespace Cypress {
       interface Chainable {
         pickOption(label: string): Chainable<void>;
       }
     }
   }
   export {};
   ```

Do **not** create a command when it is used in only one spec (keep it inline), when it is a plain wrapper around a single `cy.get(...)` (an alias is enough), or when it would hide assertions and obscure why the test passes. Prefix internal helpers with `_` (e.g. `_waitForPanel`) to mark them as not for direct use in specs.

## Fixtures

Static JSON test input lives in `cypress/fixtures/` and loads with `cy.fixture('name')`. Reach for a fixture when you need more than ~5 lines of inline data, the same data across specs, or a stubbed HTTP response:

```ts
beforeEach(() => {
  cy.fixture('select.options.json').as('options');
  cy.intercept('GET', '/api/options', { fixture: 'select.options.json' });
  cy.visit('/select');
});
```

Name them `<feature>.<purpose>.json` (e.g. `select.options.json`). Keep them small and human-readable.

## Accessibility (opt-in)

Add an axe check when the user asks for it or when a component's accessibility behavior is the thing under test (see the [a11y style guide](../../../../style-guide/style-guide.a11y.md)). Install `cypress-axe`, then:

```ts
beforeEach(() => {
  cy.visit('/select');
  cy.injectAxe();
});

it('has no accessibility violations', () => {
  cy.checkA11y('app-select');
});
```

## Running

Use the commands resolved in [SKILL step 2](../SKILL.md#2-resolve-the-projects-commands). The app must be serving at `baseUrl` first.

```bash
# Nx
nx e2e <app>-e2e --spec "<app>-e2e/src/e2e/select.cy.ts"

# Angular CLI / plain Cypress (app already serving)
pnpm exec cypress run --spec "cypress/e2e/select.cy.ts"

# headed, for debugging
pnpm exec cypress open
```

Prefer the server the user already has running on `http://localhost:4200`. Starting one counts as starting a dev server: ask for explicit approval first (per `AGENTS.md`), and only then use `start-server-and-test` for a one-shot run that boots the app, waits, runs, and tears down:

```bash
pnpm exec start-server-and-test "ng serve" http://localhost:4200 "cypress run --spec cypress/e2e/select.cy.ts"
```

## Checklist

- [ ] Spec is `<component>.cy.ts` in the detected e2e directory
- [ ] Opens with a self-test (component present) and tests real behavior
- [ ] Selectors follow the ladder (`findByRole` first); internals only inside a typed custom command
- [ ] No `cy.wait(<ms>)`; assertions use `.should()` retry-ability
- [ ] Custom commands are typed in `commands.d.ts`; shared data is a fixture
- [ ] Spec run green, or stopped with a clear report
