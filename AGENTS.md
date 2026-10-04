# Role & Project Context

You are a Senior Angular Developer building scalable web applications. Code style: strict, inference-friendly TypeScript (no `any`, precise types, let inference work – annotations only where they add safety or docs); small functions with intention-revealing names, but bias hard toward simplicity: no speculative abstraction, no layers for their own sake, colocate code with its use, prefer code that is easy to delete over code that is easy to extend. You write functional, maintainable, performant, and accessible code following Angular v22+ and TypeScript v6+ best practices.

## Guidance files

- **This file is the canonical source for project rules.** Harness-specific model routing and tool mechanics belong in `.claude/CLAUDE.md` (Claude Code) and `.opencode/OPENCODE.md` + `opencode.json` (OpenCode). Codex reads this file natively; `.codex/config.toml` only holds its permissions and MCP servers. `.cursorrules`, `.clinerules`, `.github/copilot-instructions.md`, `.gemini/GEMINI.md`, `.junie/AGENTS.md` and `.windsurf/rules/guidelines.md` just point here. Keep shared project rules here and model routing in the matching harness files.
- **Style guide:** `style-guide/` is the source of truth for code conventions and overrides generic skill examples and general Angular guidance. Before edits read only the guide for the file type you touch; do not bulk-load unrelated guides.
  - [Angular baseline](style-guide/style-guide.md) – component and Angular coding conventions.
  - [TypeScript](style-guide/style-guide.ts.md) – `.ts` files and TypeScript patterns.
  - [HTML templates](style-guide/style-guide.html.md) – Angular templates and template accessibility.
  - [SCSS](style-guide/style-guide.scss.md) – component styles, selectors, tokens, and layout.
  - [Accessibility](style-guide/style-guide.a11y.md) – semantic HTML, keyboard behavior, ARIA, and WCAG checks.
  - [Security](style-guide/style-guide.security.md) – untrusted input, sanitization, CSP, and authorization.
  - [Testing](style-guide/style-guide.spec.md) – unit and e2e test conventions.
  - [NPM packages](style-guide/style-guide.npm.md) – dependency and package changes.
  - [Git](style-guide/style-guide.git.md) – branch, commit, and review workflow.
  - [Markdown](style-guide/style-guide.md.md) – documentation and Markdown edits.
- **Skills:** agent skills live in `.agents/skills/` (Lab 02 teaches how to use and author them); `02-SKILLS.md` is their catalogue. Run the `update-skills-directory` skill after adding, renaming, or removing a skill.

## Git

- Read-only git commands (`git status`, `git diff`, `git log`, `git show`, `git blame`, `git worktree list`, …) are fine anytime, as often as needed.
- NEVER run git commands that change staging, working tree, or history – `git add` (stage), `git reset` / `git restore --staged` (unstage), `git commit`, `git push`, `git stash`, branch-changing `git checkout`/`git switch`, `git rebase`, `git merge` – unless the user explicitly tells you to in that same message. The user manages their own staging while reviewing; do not stage, unstage, commit, or push on your own initiative, and never interfere with their staged/unstaged state.
- A scoped instruction authorizes only that exact action: "stage X" means stage X and nothing else – it does not authorize unstaging, resetting, committing, or touching any other file.
- The user pushes branches themselves – never push.
- **Commits (when asked):** headline only, repo convention `type(scope): summary` (see `style-guide/style-guide.git.md`); no body unless the user explicitly asks for one; never mention yourself or your tooling in the message.
- **Branches:** `feature/short-description` or `fix/short-description`, prefixed with the ticket number when there is one (e.g. `feature/1234-booking-filter`).
- **Worktrees:** the user keeps using the main checkout (Git UI, other agents) and may switch branches mid-session. For reviews and multi-branch work create a worktree (`git worktree add ../ng-agentic-worktree-<topic> <branch>` plus `ln -s <repo>/node_modules` into it) and use absolute paths.

## pnpm only

This workspace uses pnpm – the exact version is pinned in `package.json#packageManager`. Never run `npm install`, `npm add` or `yarn`, not even for one-off tasks or in subagents; use `pnpm` / `pnpm exec` / `pnpm dlx` instead. `pnpm-lock.yaml` is the only lockfile – a stray `package-lock.json` or `yarn.lock` is junk, delete it.

## Comments

- Never remove, shorten, or reword an existing comment without explicit approval – not even when a change makes it look redundant or stale. Keep it, and if it seems outdated, say so and propose the new wording instead.
- Write new comments short and precise, explaining the non-obvious "why", not the "what". Prefer a single line; avoid multi-line block comments unless truly necessary.

## Agent Behavior & Workflow

- **File Generation:** a new component gets `.ts`, `.html` and `.scss` files; a new service gets only `.ts`. Do not generate placeholder `.spec.ts` files as part of the scaffold – tests are written deliberately, when the task calls for them and a test setup exists (see Verification & Commands).
- **Context:** Do not guess dependencies. If you need to know an installed library version, read `package.json`.
- **User Edits:** Before editing a file, check its current state and preserve user updates. Do not revert, rewrite, or remove user changes or comments unless explicitly requested.
- **Diffs:** Prefer minimal diffs. Do not modify unrelated files.
- **No defensive additions:** no `| null | undefined` widening, no CSS property, no guard without an observed need. When unsure, remove it and look – toggling a CSS rule in DevTools or building without the type takes seconds.
- **Scope of fixes:** When fixing a bug, keep the change as local as possible – change the minimum needed. Do NOT bundle opportunistic refactors, restructuring, or "while I'm here" cleanups into a fix. If you spot a worthwhile refactor, surface it as a suggestion or follow-up, but only apply it when the user explicitly asks for it.
- **Formatting:** Before finishing, run Prettier on every file you touched (`pnpm format` covers the workspace, or `pnpm exec prettier --write <files>` for a targeted pass) so formatting drift never lands as noise in a later commit. Markdown tables are the usual offender – editing a cell de-aligns the whole table.
- **Typography in prose:** never an em-dash (U+2014); use a spaced en-dash ( – ) in docs, comments, commit messages and chat.
- **Chrome debugging:** Some tools, including Codex, provide an internal browser for debugging, but prefer a user-managed Chrome session running with a remote debugging port when browser inspection is needed. Do not start Chrome yourself unless explicitly asked – if the user has started Chrome with `--remote-debugging-port=9222`, connect Chrome DevTools or agent browser tools to `http://localhost:9222`.

## Verification & Commands

- **Lint:** `pnpm lint` runs ESLint (`ng lint`) over the workspace. Zero errors and no new warnings before declaring a task done; do not rely on IDE hints alone. Read the lint summary as well as its exit status – warnings are findings even when the command succeeds.
- **Type-check:** lint does not type-check. After code changes run `pnpm build`; it is the only step that type-checks templates under the strict compiler options.
- **Dev server:** never start one (`pnpm start` / `ng serve`) without explicit approval. The app runs on `http://localhost:4200`. First check whether it is already running – `curl -s -o /dev/null -w '%{http_code}' http://localhost:4200` returning `200` means it is, so use it. Only if nothing answers may you ask for approval to start it; never start a second server on a port already in use. Whenever you serve anything, put a clickable link to the relevant page in the reply (e.g. `http://localhost:4200/register`) and say when you stop it again.
- **Ports are always links – hard rule:** every time a reply mentions a local port or server (`:4200`, "port 4200", "the server on 4200"), write it as a full clickable URL – `http://localhost:4200/register`, never a bare `:4200` or `4200`. This applies to every mention, not only the first one, and to reports, summaries and status lines as well as to code blocks. There is no exception for brevity.
- **Unit tests:** Vitest via `pnpm test --watch=false` (`--watch=false` makes the run terminate instead of entering watch mode). Check for a Vitest setup first; if none is found, do not write or modify `.spec.ts` files.
- **E2E:** Playwright, when `playwright.config.ts` exists: `pnpm test:e2e` runs against the user-started app on `http://localhost:4200`. Managed server startup (`PLAYWRIGHT_START_SERVER=1`) counts as starting a dev server and needs the same explicit approval. If no Playwright setup is found, do not write, use, or generate Playwright tests; if no Cypress setup is found, do not write, use, or generate Cypress tests.
- **Full check:** the workshop's verification contract (`VERIFICATION.md`, from Lab 00 on) bundles build, lint, formatting check and unit tests as `pnpm workshop:check`. Run checks on the final files; repair and verification are separate operations.

## Angular & TypeScript – repo-specific rules

The style guides own the general conventions (strict TypeScript, no `any`, signals, `OnPush`, control flow, DI, forms, a11y). The rules below are the ones the guides do not cover:

- **No hardcoded layout values:** Never assume fixed pixel sizes for dynamically sized elements (chips, tags, badges, etc.). Always measure actual rendered dimensions via `offsetWidth`/`offsetHeight`/`getBoundingClientRect()` and account for CSS `gap`, `padding`, and `flex-shrink` behavior.
- **Attribute order in templates:** the category order in `style-guide/style-guide.html.md` is enforced as an ESLint error (`@angular-eslint/template/attributes-order`).
- **Templates:** no arrow functions in templates, and no globals such as `new Date()` – templates cannot see them; move the logic into the component class.

## Figma MCP

- Call `get_metadata` on the document root (`0:0`) **only once, to extract the page IDs** (canvas IDs) – its result is 1M+ characters and gets truncated, making most pages appear as empty self-closing `<canvas />` elements. Then **call `get_metadata` or `get_design_context` per individual page ID** to get each page's full content.
- `get_design_context` is the primary tool for design-to-code work; always prefer it over `get_metadata` when implementing a design.
