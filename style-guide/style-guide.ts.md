# TypeScript Style Guide

Last updated on 2026-09-07.

This document contains guidelines for _Angular_ TypeScript files.

## Do

### Must do

- use [**Angular coding style guide**](https://angular.dev/style-guide)
  - [rule of one](https://angular.dev/style-guide#rule-of-one)
  - put entities and services into the scope where they are being used
- use [**Prettier**](https://prettier.io/)
  - use config from `prettier.config.js`
  - use for these endings: {css,html,js,json,md,scss,ts}
  - use Prettier on save hook
- use [**ESLint**](https://eslint.org/)
  - use config from /eslint.config.js
  - use ESLint on save hook
- use descriptive and meaningful names for all symbols
  - boolean fields always start with `is`, `has`, `show` or alike (e.g. `isLoading` or `hasChanges()`)
    - exception: public component **inputs** are bare adjectives or feature nouns (`bordered`, `loading`, `multiSelection`), with `hide*` / `show*` only for visibility toggles; component **outputs** are past-tense events (`blurred`, `filesChanged`)
      - two-way pairs follow Angular's `<name>Change` convention instead (`nodes` + `nodesChange`, as `model()` generates), so `[(nodes)]` binds
  - event functions start with `on` (e.g., `onSave()`)
- refactor symbol names if necessary (e.g., due to requirements changes)
- annotate public/protected APIs, function parameters, and non-obvious return values (also `void`)
  - prefer type inference for obvious locals and simple initializers (e.g. `const x = 1`)
- prefer `Type[]` over `Array<Type>` for array types
- always use curly braces `{}` for control flow statements
- clean up debug code before committing (e.g., no console.log, temporarily disabled in ESLint for debugging)
- remove unused variables and imports
- use `private` by default, to encapsulate properties and methods
- use `protected` for symbols that should be accessible in the component's view template
- use `readonly` by default, unless a property needs to be reassigned
  - always use `readonly` on properties that are initialized by Angular
- use `const` by default, unless a variable needs to be reassigned
- use `static` for variables that are part of the class but not of the instance
- keep constructors and lifecycle hooks simple and clean (basically only call methods, except one-liners)
  - avoid lifecycle hooks in the first place
  - for DOM work after render, prefer `afterNextRender()` / `afterRenderEffect()` over `ngAfterViewInit`

### Should do

- keep components and directives focused on presentation
- max 400 LoC per file (e.g. extract static functions to utils)
- max 120 characters per line of code (160 for comments)
- avoid overly complex functions (max cyclomatic complexity of 20)
- prefer types to interfaces
- prefer types to enums (enums are okay for strings and magic numbers)
- group components, directives, pipes & services like this
  - decorator (`@Component`)
  - class with `extends` & `implements`
  - injects (`inject()`)
  - properties
    - static
    - inputs, models, outputs
    - viewChildren, contentChildren
    - signals, computed
    - other properties
  - methods
    - static
    - constructor (containing afterNextRender / afterEveryRender / afterRenderEffect, effects, and function calls)
    - lifecycle hooks (better: avoid lifecycle hooks)
    - control value accessor
    - event handlers (onXyz())
    - other methods
- place fields and methods next to each other if they belong together
  - no alphabetic order, no order by access modifier
- prefer easily understandable code over performance (except for performance-critical code)
- use strict equality (`===` / `!==`) instead of loose equality (`==` / `!=`)
- sort imports (group and sort named imports alphabetically)
- prefer short functions (no spaghetti code)
- avoid variable shadowing
- declare one variable per statement
- prefer arrow functions for callbacks
- use comments for complex code, and only if necessary (the usage of descriptive and meaningful names for methods and variables should be enough in many cases, comments do not make up for bad code)
- mark todos with `// @ToDo: task description`
- distinguish between Smart/Controller and Dumb/Presentational Components
- lazy-load feature routes; use `@defer` for expensive non-critical view fragments
- `immutability` over `mutability` (for `OnPush` and `OnChanges`)
  - use `...` spread operator for shallow copies
  - use `structuredClone()` or a well-maintained package such as `klona` for deep copies
- rely on the default `OnPush` change detection in Angular v22+; do not set it explicitly or opt a component into `Eager`
- use `Standalone Components` over `Modules`
  - do not set `standalone: true` inside Angular decorators, it is the default in Angular v20+
- use the Signals API for state management (`signal()`, `computed()`, `effect()`)
- use signal inputs (`input()`, `input.required()`), models (`model()`), outputs (`output()`), and queries (`viewChild()`) over decorators (`@Input()`, `@Output()`, `@ViewChild()`)
- prefer Signal Forms (stable in v22) for production form work (`form()`, schema-based validators, field state)
  - use Reactive Forms only when maintaining an existing Reactive Forms area, integrating with APIs that require it, or when the user explicitly asks for it
  - never use Template-driven forms for production code
- prefer `resource()`, `rxResource()`, or `httpResource()` (all stable in v22) for signal-driven read operations
  - use service methods / `HttpClient` directly for mutations and imperative workflows
- when using RxJS (interop, event streams, complex async):
  - suffix observables with `$`
  - prefer the `AsyncPipe`; when subscribing manually, use `takeUntilDestroyed()` (in a field initializer/constructor, else pass `DestroyRef`)
  - avoid nested subscriptions (e.g. use `switchMap`)
- assume a zoneless app: never import `zone.js`; rely on signals for reactivity (zoneless is the default in Angular v22+)
- prefer default `ViewEncapsulation` (`Emulated`)
- prefer `inject()` over constructor dependency injection
  - group all `inject()` calls at the top of the class
- prefer the `@Service()` decorator (new in v22) for new singleton services
  - use `@Injectable({ providedIn: 'root' })` when provider configuration or compatibility requires it
- consider `injectAsync()` to lazy-load heavy services where it reduces the initial bundle
- it's okay to use `protected readonly` services directly in the View Template (HTML)
- use initial / default values only when they represent valid domain state
  - preserve `undefined` when absence differs from an empty value (e.g. `signal<string | undefined>(undefined)` for a string that has not been set)
  - use `??` when only `null` / `undefined` should trigger a fallback; use `||` only when all falsy values should
  - display-only strings (labels, titles, placeholders) may default to `''` and fall back with `||`
- prefer `?: Type` shorthand over `:Type | undefined`
- use `Partial<Type>` only for genuinely partial data (e.g. a patch); do not make required fields optional just to initialize an object with `{}`
- use `!` with caution and only if you are sure that the value can never be `null` or `undefined` (e.g. required `@Inputs`, `viewChild()`)
- use `input.required<Type>()` for required inputs
- use the `host` object in `@Component` or `@Directive` instead of `@HostBinding` and `@HostListener`
- use variable `as` Type for type castings instead of `<Type>variable`

## Don't

- don't use (default) `public` modifier for properties and methods
- don't use ambiguous or unfamiliar abbreviations
- don't leave debug logs in the codebase
- don't keep empty constructors
- don't keep empty methods
- don't scaffold inline templates or styles; new components use separate `.ts`, `.html` and `.scss` files
- avoid `any`, prefer `unknown`
- avoid these lifecycle hooks where possible
  - `DoCheck()`
  - `AfterContentChecked()`
  - `AfterViewChecked()`
- if using signal-based data binding (signal inputs, outputs and queries) already
  - avoid ALL lifecycle hooks
- don't put leading `I` for interfaces
- don't prefix private/protected members with `_`

## Resources

- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Angular coding style guide](https://angular.dev/style-guide)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

## Back to index

- [Angular Coding Style Guide](style-guide.md)
