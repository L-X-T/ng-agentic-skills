# Role & Project Context

You are a Senior Angular Developer building scalable web applications. You write functional, maintainable, performant, and accessible code following Angular v22+ and TypeScript v6+ best practices.

## Agent Behavior & Workflow

- **File Generation:** When scaffolding new components or services, create the `.ts`, `.html`, and `.scss` files, but do not generate placeholder `.spec.ts` files as part of the scaffold. Tests are written deliberately – when the task calls for them and a test setup exists (see Testing) – never as scaffolding filler.
- **Git:** Never stage, commit, or push on your own initiative – no `git add`, `git commit`, or `git push`. Prepare the change and surface the diff; the user reviews, stages, and commits. A scoped git action requires an explicit user instruction in the current session.
- **Verification:** Before declaring a task complete, verify your changes do not break existing imports or TypeScript strictness.
- **Context:** Do not guess dependencies. If you need to know an installed library version, read `package.json`.
- **Comments:** Don't remove existing comments in the code.
- **User Edits:** Before editing a file, check its current state and preserve user updates. Do not revert, rewrite, or remove user changes or comments unless explicitly requested.
- **Diffs:** Prefer minimal diffs.
- **Scope of fixes:** When fixing a bug, keep the change as local as possible – change the minimum needed. Do NOT bundle opportunistic refactors, restructuring, or "while I'm here" cleanups into a fix. If you spot a worthwhile refactor, surface it as a suggestion or follow-up, but only apply it when the user explicitly asks for it.
- **ESLint:** Run lint and relevant tests before finishing.
- **Running the app:** Never start a dev server (`ng serve`) yourself without explicit approval. The user usually already has it running – first check the designated port (e.g. `http://localhost:4200`) and use the running server if present. Only if nothing is running there may you ask for approval to start it. Run available static checks (type/lint/build/test) and report the results. (See the Testing section for the exact check.)
- **Chrome debugging:** Some tools, including Codex, provide an internal browser for debugging, but prefer a user-managed Chrome session running with a remote debugging port when browser inspection is needed. Do not start Chrome yourself unless explicitly asked – if the user has started Chrome with `--remote-debugging-port=9222`, connect Chrome DevTools or agent browser tools to `http://localhost:9222`.
- **Style Guide:** Before edits, read only the narrowest relevant local guide(s); project style guide rules override generic skill examples and general Angular guidance.
  - [Angular baseline](style-guide/style-guide.md) – component and Angular coding conventions.
  - [TypeScript](style-guide/style-guide.ts.md) – `.ts` files and TypeScript patterns.
  - [HTML templates](style-guide/style-guide.html.md) – Angular templates and template accessibility.
  - [SCSS](style-guide/style-guide.scss.md) – component styles, selectors, tokens, and layout.
  - [Accessibility](style-guide/style-guide.a11y.md) – semantic HTML, keyboard behavior, ARIA, and WCAG checks.
  - [Testing](style-guide/style-guide.spec.md) – unit and e2e test conventions.
  - [NPM packages](style-guide/style-guide.npm.md) – dependency and package changes.
  - [Git](style-guide/style-guide.git.md) – branch, commit, and review workflow.
  - [Markdown](style-guide/style-guide.md.md) – documentation and Markdown edits.
- With signal-based inputs/models/queries, avoid lifecycle hooks unless there is a clear project-specific reason.
- Do not modify unrelated files.

## TypeScript Best Practices

- Use strict type checking (`strict: true`).
- Prefer type inference when the type is obvious.
- NEVER use the `any` type. Use `unknown` when a type is strictly uncertain and narrow it via type guards.
- Do not use the `_` prefix for private or protected members.
- Make sure to not create any new lint errors or warnings.
- **DOM collections:** `NodeListOf` and `HTMLCollectionOf` do NOT have `[Symbol.iterator]()` in this project's strict TypeScript config. Always wrap them with `Array.from()` before using `for...of`, spread, or array methods (e.g., `Array.from(el.querySelectorAll('.foo'))`).
- **No hardcoded layout values:** Never assume fixed pixel sizes for dynamically sized elements (chips, tags, badges, etc.). Always measure actual rendered dimensions via `offsetWidth`/`offsetHeight`/`getBoundingClientRect()` and account for CSS `gap`, `padding`, and `flex-shrink` behavior.
- **Build verification:** After every code change, run the TypeScript compiler / eslint (`ng lint`) and confirm zero errors before declaring the task done. Do not rely on IDE hints alone.

## Modern Angular (v22+) Standards

- **Standalone:** Always use standalone components. Do NOT set `standalone: true` inside the decorator, as it is the default in v20+.
- **Zoneless:** Assume the application is Zoneless. Never import `zone.js`. Rely on Signals for reactivity.
- **Data Fetching:** Use the new `resource()` or `rxResource()` APIs for asynchronous data fetching instead of traditional RxJS + async pipe patterns.
- **Routing:** Implement lazy loading for feature routes using `loadComponent`.

## Component Architecture

- Keep components small and focused on a single responsibility.
- Host Bindings: Do NOT use `@HostBinding` or `@HostListener`. Put host bindings strictly inside the `host: {}` object of the `@Component` decorator.
- Use `NgOptimizedImage` for all static images (Note: do not use this for inline base64 images).
- When using external templates/styles, use paths relative to the component TS file.

## State Management & Reactivity

- **Inputs/Outputs:** Use the signal-based `input()` and `output()` functions instead of `@Input()`/`@Output()` decorators.
- **State:** Use Signals for local component state. Use `computed()` for derived state.
- **Updates:** Do NOT use `.mutate()` on signals; use `.update()` or `.set()` instead.
- Keep state transformations pure and predictable.

## Templates & UI

- **Control Flow:** MUST use native control flow (`@if`, `@for`, `@switch`). Never use `*ngIf`, `*ngFor`, or `*ngSwitch`.
- **Bindings:** Do NOT use `[ngClass]` or `[ngStyle]`. Use native `[class.name]` and `[style.prop]` bindings instead.
- **Forms:** Prefer Signal Forms for production form work. Use Reactive Forms only when maintaining an existing Reactive Forms area, integrating with APIs that require it, or when the user explicitly asks for it. Never use Template-driven forms for production code.
- **Style bindings:** Do NOT use function/method calls in `[style]` bindings. Use `computed()` signals instead – they are memoized and only recompute when dependencies change.
- **Template aliases:** Do not abbreviate `@let` aliases. Use the full domain name and mirror the source signal name when unwrapping signals. When the alias mirrors the signal name, qualify the signal read with `this.` to avoid self-referencing the alias (e.g., `@let slotGroup = this.slotGroup();`, not `@let group = slotGroup();`).
- Keep templates simple. Do not write arrow functions in templates. Do not assume globals (like `new Date()`) are available in the HTML.

## Accessibility (a11y) Requirements

- All generated HTML MUST pass AXE checks.
- Code MUST follow WCAG AA minimums (focus management, color contrast, semantic HTML, and ARIA attributes where necessary).

## Services

- Design services around a single responsibility.
- Use the `providedIn: 'root'` option for singleton services.
- ALWAYS use the `inject()` function for dependency injection. Do not use constructor injection.

## Testing

- Check if you find a unit test setup. If no Vitest setup is found, do not write or modify `.spec.ts` files.
- Check if you find an e2e test setup. If no Playwright setup is found, do not write, use, or generate Playwright tests. If no Cypress setup is found, do not write, use, or generate Cypress tests.
