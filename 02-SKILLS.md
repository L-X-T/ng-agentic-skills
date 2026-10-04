# Skills

Agent skills for this repository live under `.agents/skills/`. Each skill folder contains a
`SKILL.md` plus optional `references/`, `scripts/`, or `assets/` support files loaded just in time.
They fall into two groups: **third-party skills** copied or adapted from public sources, and
**custom skills** authored in this repository.

Work through [Lab 02 – Agent Skills](labs/02-skills.html) to try a few skills on your own project
and author one custom skill.

To keep this index honest, run the
[`update-skills-directory`](.agents/skills/update-skills-directory/SKILL.md) skill whenever a
skill is added, renamed, or removed – it verifies skill frontmatter, support-file structure, and
links from this index.

## Choose the smallest useful mechanism

For a booking-list task, put each instruction where it belongs:

| Need                               | Home                                | Example                                                    |
| ---------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Convention for every relevant edit | AGENTS.md or the linked style guide | Preserve public inputs and outputs                         |
| Repeatable task with judgment      | Skill                               | Inspect, characterize, then modernize a component          |
| Deterministic operation            | Script or official schematic        | Run the same verification commands and report every result |
| One request's outcome              | Prompt                              | Hide cancelled bookings in this view                       |

A skill may call a script. It should not regenerate that script on every run or copy every global rule.

## Blog coverage

The [skills blog post](https://www.angulararchitects.io/blog/ae-skills-for-angular/) covers
29 skills: 10 third-party (including `unslop`, `implement-plan` and `ng-verify-feature`) and
19 custom. This catalogue also includes `update-skills` and `frontend-design`, bringing it to
31 skills: 11 third-party and 20 custom. The post also mentions `angular-new-app` as intentionally unadopted and two private
bookkeeping skills outside this Angular catalogue.

`angular-developer` and `test-driven-development` remain available as optional examples, even
though the author no longer uses them in his daily workflow: frontier models carry the
`angular-developer` knowledge built in, and he prefers writing e2e tests alongside the
implementation over strict red-green-refactor. The shared `code-review` skill uses one
independent reviewer; the post's three-model setup describes a personal customization.

`git-stack-rewrite` is explicit-only: its frontmatter configures Claude Code, and
`agents/openai.yaml` configures Codex. Invocation settings do not grant permission to change Git state.

## Pick by activity

Start with `create-a-skill` and one task skill. Install `code-review` when reviewing a diff; use
`grill-me` or `brainstorming` only when design uncertainty justifies it. The remaining catalogue
is available when needed; installing every skill is not a prerequisite for learning the pattern.

| Activity            | First choice                                                              | Boundary                                                     |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Build               | implement-plan for approved plans; ng-forms or ng-data-access for a slice | Discover dependencies before generating                      |
| Diagnose            | diagnosing-bugs                                                           | Reproduce before changing production code                    |
| Verify              | ng-verify-feature; code-review; ng-testing; create-e2e-tests              | Review claims; don't confuse unit and browser runners        |
| Modernize           | ng-migrate for schematics; ng-refactor for the overall process            | ng-refactor delegates migrations; it does not duplicate them |
| Coordinate          | handover; grill-me or grill-with-style; brainstorming                     | Decisions, planning and transfer have different outputs      |
| Inspect a specialty | ng-accessibility, ng-security, ng-performance                             | Load the lens that the task actually needs                   |

The provenance catalogue below remains the complete inventory. See
[SKILL-MAINTENANCE.md](SKILL-MAINTENANCE.md) for host-specific discovery, upstream records and
the evaluation sheet used by Lab 02.

## Why skills keep your context clean

Reaching for a task-specific skill instead of loading everything from `AGENTS.md` is one of the
most important things you can do for output quality. `AGENTS.md` is always in context, so every
piece of general guidance it carries crowds the window with instructions irrelevant to the task at
hand. A skill is pulled in only when the task calls for it, keeping that guidance out of context
until it matters.

That keeps the working context lean and focused – and a lean, focused context is exactly what gets
good results out of an LLM. A bloated context dilutes attention, buries the relevant instructions,
and degrades the quality of the answer. So prefer a narrow skill for a specific job over piling
more general rules into `AGENTS.md`.

## Third-party skills

Copied or adapted from public sources; the origin column records where each skill came from.

| Skill                                                                      | What it does                                                                                                                                                            | Origin                                                                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [angular-developer](.agents/skills/angular-developer/SKILL.md)             | The _Angular_ team's **official developer skill** – generates code and architectural guidance across signals, forms, DI, routing, SSR, testing, and CLI/MCP tooling.    | [`angular/skills`](https://github.com/angular/skills)                                                |
| [brainstorming](.agents/skills/brainstorming/SKILL.md)                     | **Design-first workflow**: chooses a feasibility spike, a short design, or a full specification according to the request.                                               | [`obra/superpowers`](https://github.com/obra/superpowers)                                            |
| [code-review](.agents/skills/code-review/SKILL.md)                         | Reviews current, staged, last-commit, or merge/PR work in **two passes – requirements, then style-guide and _Angular_ v22+ conformance** – via a reviewer subagent.     | [`obra/superpowers`](https://github.com/obra/superpowers) (adapted)                                  |
| [diagnosing-bugs](.agents/skills/diagnosing-bugs/SKILL.md)                 | Six-phase bug hunt that **builds a red-capable feedback loop before hypothesising** – vitest/Playwright/`curl`/`git bisect` – then fixes behind a regression test.      | [`mattpocock/skills`](https://github.com/mattpocock/skills) (adapted)                                |
| [frontend-design](.agents/skills/frontend-design/SKILL.md)                 | Anthropic's visual design guidance for distinctive UI – aesthetic direction, typography, layout, motion, and interface copy.                                            | [`anthropics/skills`](https://github.com/anthropics/skills/tree/main/skills/frontend-design)         |
| [grill-me](.agents/skills/grill-me/SKILL.md)                               | Interrogates a plan **one question at a time** – recommending an answer for each – until shared understanding; no building until you confirm.                           | [`mattpocock/skills`](https://github.com/mattpocock/skills)                                          |
| [implement-plan](.agents/skills/implement-plan/SKILL.md)                   | Executes an approved plan in small working slices, verifies each slice, and reconciles the final result with the acceptance criteria.                                   | [`obra/superpowers`](https://github.com/obra/superpowers) (adapted from `executing-plans`)           |
| [ng-verify-feature](.agents/skills/ng-verify-feature/SKILL.md)             | Verifies a running Angular feature against acceptance criteria in Chrome, reporting coverage and reproduction evidence.                                                 | [`vercel-labs/agent-browser`](https://github.com/vercel-labs/agent-browser) (adapted from `dogfood`) |
| [spartan](.agents/skills/spartan/SKILL.md)                                 | Adds, composes, styles, and debugs spartan/ui components across **Brain (headless) and Helm (styled)** via the `@spartan-ng/cli` generators and MCP tools.              | [`spartan-ng/spartan`](https://github.com/spartan-ng/spartan)                                        |
| [test-driven-development](.agents/skills/test-driven-development/SKILL.md) | Enforces **red-green-refactor discipline** – no production code without a failing test you watched fail – delegating test mechanics to ng-testing and create-e2e-tests. | [`obra/superpowers`](https://github.com/obra/superpowers) (adapted)                                  |
| [unslop](.agents/skills/unslop/SKILL.md)                                   | Edits prose to **cut AI-writing tells**, mannered language, and over-compression while preserving meaning and improving clarity.                                        | [`cursor/plugins`](https://github.com/cursor/plugins) (adapted)                                      |

### Local adaptations

Every vendored copy is normalized to house conventions: support docs move into `references/`,
the description is rewritten to state _what it does + when to use it_ (that text triggers skill
selection), formatting follows the repo's Prettier settings, commands use pnpm (`pnpm add`,
`pnpm exec`, `pnpm dlx`), prose uses the spaced en dash, the upstream license travels along as
`references/LICENSE.txt`, and any upstream auto-commit step becomes "surface the diff – the user
commits". Normalization is not an adaptation. The table records each vendored skill's status;
the bullets below hold the behavioral details to preserve when re-syncing with upstream.

| Skill                   | Status                           | Preserve on re-sync                                                                                                                                   |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| angular-developer       | normalized + content corrections | `signal-forms.md` on the stable v22 API; `tailwind-css.md` gated on detection; e2e setup deferred to create-e2e-tests whenever a runner is configured |
| brainstorming           | adapted + privacy hardening      | visual-companion scripts bind `127.0.0.1`, per-session key, branding image opt-in                                                                     |
| code-review             | adapted                          | see bullet                                                                                                                                            |
| diagnosing-bugs         | adapted                          | see bullet                                                                                                                                            |
| frontend-design         | normalized only                  | upstream design workflow retained; trigger wording, typography, formatting, and license path normalized                                               |
| grill-me                | adapted (instructions inlined)   | retains one-question-at-a-time interviews; upstream now delegates to round-based `grilling`                                                           |
| implement-plan          | adapted from `executing-plans`   | see bullet                                                                                                                                            |
| ng-verify-feature       | adapted from `dogfood`           | see bullet                                                                                                                                            |
| spartan                 | normalized only                  | exact copy apart from layout and pnpm commands (`pnpm exec nx g`, `pnpm add`); `user-invocable: false` upstream, so it triggers implicitly            |
| test-driven-development | adapted                          | see bullet                                                                                                                                            |
| unslop                  | adapted                          | see bullet                                                                                                                                            |

Behavioral adaptations:

- **brainstorming** – adopts spike, bounded, and architectural paths while retaining the narrow
  design-first trigger, existing session authorization, local planning fallback, and hardened
  visual-companion scripts. Small, already-specified tasks do not trigger brainstorming.
- **code-review** – renamed from `requesting-code-review`: four review scopes (current / staged /
  last-commit / merge-PR), a no-subagent fallback, and a second pass against the project style
  guides and _Angular_ v22+ baseline. Reviews report findings first; edits require authorization
  for the relevant implementation or fixes. A harness file (for example `.claude/CLAUDE.md`) may
  prescribe more reviewers or specific models; the skill follows it when present. Reviewers receive
  a self-contained handoff without conversation history and do not dispatch further reviewers.
- **diagnosing-bugs** – feedback loops named for this stack (vitest, Playwright, `curl`,
  `git bisect run`); upstream's `CONTEXT.md` and handoff commands repointed to an `ADR.md` (when present) and the
  local `ng-review-architecture` / `grill-me` / `handover` skills.
- **implement-plan** – adapted from `executing-plans`: working slices and project-owned checks;
  required Superpowers sibling skills, automatic Git operations, and unconditional subagent routing
  are replaced with the existing project workflow. Routine progress does not require repeated approval.
- **ng-verify-feature** – adapted from `dogfood`: feature acceptance coverage, existing Chrome tools,
  and evidence proportional to the finding. No agent-browser dependency, issue quota, mandatory video,
  automatic server/browser startup, or authentication-state export.
- **test-driven-development** – pnpm/vitest commands; test-writing mechanics delegated to
  [ng-testing](.agents/skills/ng-testing/SKILL.md) and
  [create-e2e-tests](.agents/skills/create-e2e-tests/SKILL.md) so discipline and how-to stay
  separate. The new `writing-good-tests.md` reference adds test-quality guidance; the older mocking
  examples remain available. Fixtures match the real typed contract and the exercised scenario;
  optional fields are not added speculatively.
- **unslop** – pattern 13 preserves the spaced en dash ( – ), pattern 17 leaves heading case to the
  project's Markdown guide instead of forcing sentence case, and pattern 18 keeps intentional
  emojis, including podium markers. Em dashes remain banned. The skill is model-invocable for
  prose tasks; the description replaces upstream's unscoped trigger.

The content corrections in the table are kept deliberately ahead of upstream: Tailwind must be
detected, not assumed, and e2e specs go through create-e2e-tests once a runner is configured, so
upstream's `ng add` setup notes apply only to a workspace without one.

### Verification adaptations

The local TDD and ng-testing workflows distinguish new behavior from characterization of existing
behavior: a passing characterization baseline is expected, and an isolated temporary mutation can
prove red-capability. Never delete user-owned code to manufacture red. Browser-test guidance applies
the project's server-approval rule to automatic webServer/builder startup as well as direct commands.

### Scanning skills for vulnerabilities

Skills are executable instructions, so a third-party skill is as risky as any dependency you
pull in. [NVIDIA SkillSpector](https://github.com/NVIDIA/SkillSpector) is an open-source
(Apache 2.0) security scanner built for exactly this: point it at a skill – a git repo, URL, zip,
directory, or single file – and it flags vulnerabilities, malicious patterns, and security risks
before you install it. At the time of writing (July 2026) it checks 64 patterns across 16 categories (prompt injection,
data exfiltration, privilege escalation, supply chain, excessive agency, system-prompt leakage,
MCP tool poisoning, and more) – volatile numbers, so re-verify them against the repo during each
freshness pass – combining fast static analysis with optional LLM semantic analysis and
live CVE lookups, and emits terminal, JSON, Markdown, or SARIF reports plus a 0–100 risk score.

Use it to vet any third-party skill before adopting it here. See the
[scanning guide](https://docs.nvidia.com/skills/scanning-agent-skills) for the workflow.

## Custom skills

Authored in this repository; each row summarizes what the skill does and links to its `SKILL.md`.

| Skill                                                                      | What it does                                                                                                                                                                                                               |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [create-a-skill](.agents/skills/create-a-skill/SKILL.md)                   | **Meta-skill** for authoring, editing, pruning, and reviewing agent skills – invocation model, information hierarchy, completion criteria. Combines and extends Matt Pocock's and Minko Gechev's skill-authoring guidance. |
| [create-e2e-tests](.agents/skills/create-e2e-tests/SKILL.md)               | Writes **one behaviour-level e2e spec** for an _Angular_ component on the installed platform (Playwright or Cypress), with a bounded run-and-fix loop.                                                                     |
| [git-stack-rewrite](.agents/skills/git-stack-rewrite/SKILL.md)             | Folds staged changes or a commit into an older commit and **rebases every dependent branch stack**, with backup refs and a verification pass.                                                                              |
| [grill-with-style](.agents/skills/grill-with-style/SKILL.md)               | Grilling session that stress-tests a plan against **the code's actual domain model and the project style guides**, sharpening terminology as it goes.                                                                      |
| [handover](.agents/skills/handover/SKILL.md)                               | Compacts the conversation into a **handover document** pointing the next agent at existing artifacts, skills, and style guides.                                                                                            |
| [ng-accessibility](.agents/skills/ng-accessibility/SKILL.md)               | Makes _Angular_ apps accessible – semantic HTML, keyboard/focus, ARIA bindings, CDK a11y – **verified against WCAG 2.x AA with automated AXE checks**.                                                                     |
| [ng-data-access](.agents/skills/ng-data-access/SKILL.md)                   | Builds the typed server-communication layer for _Angular_ v22+ – **httpResource/resource/rxResource over HttpClient** – with functional interceptors, loading/error/reload state, and SSR-safe transfer caching.           |
| [ng-forms](.agents/skills/ng-forms/SKILL.md)                               | Builds **type-safe Signal Forms** (_Angular_ v22+) – model/schema, validation, dynamic fields – through a lean router with just-in-time references.                                                                        |
| [ng-migrate](.agents/skills/ng-migrate/SKILL.md)                           | Runs `ng update` and official migration schematics **one gauntlet-verified checkpoint at a time**, with a residual-pattern check so nothing is skipped.                                                                    |
| [ng-performance](.agents/skills/ng-performance/SKILL.md)                   | Optimizes _Angular_ initial-load and runtime performance – bundles, `@defer`, SSR/hydration, zoneless – **measure-first with a re-measure verify loop**.                                                                   |
| [ng-prototype](.agents/skills/ng-prototype/SKILL.md)                       | Builds a **clearly-marked throwaway** _Angular_ prototype – terminal logic app or toggleable UI variations – to answer a design question, then absorb or delete it.                                                        |
| [ng-refactor](.agents/skills/ng-refactor/SKILL.md)                         | Refactors a dusty _Angular_ component into a clean, signal-based one via a **7-step, gauntlet-verified blueprint** with a human checkpoint every step.                                                                     |
| [ng-review-architecture](.agents/skills/ng-review-architecture/SKILL.md)   | Reviews _Angular_ architecture through **two composed lenses – DDD boundaries and module depth** – then drills into findings via a grilling loop.                                                                          |
| [ng-review-style-guide](.agents/skills/ng-review-style-guide/SKILL.md)     | Sweeps the **whole codebase against every project style guide** (auto-selected by file type), reports severity-ranked drift, then fixes on approval.                                                                       |
| [ng-security](.agents/skills/ng-security/SKILL.md)                         | Hardens _Angular_ apps – sanitization/XSS, **nonce-based CSP and Trusted Types**, HttpClient XSRF, SSR allowed hosts, and dependency hygiene.                                                                              |
| [ng-signal-store](.agents/skills/ng-signal-store/SKILL.md)                 | Manages genuinely shared state with NgRx SignalStore – entities, `rxMethod`, store testing – **gated behind a local-signals-first decision tree** so a store is added only when state is truly multi-consumer.             |
| [ng-styling](.agents/skills/ng-styling/SKILL.md)                           | Audits _Angular_ styling – bindings, encapsulation, SCSS architecture, tokens, **framework-class leakage** – against three sources, fixing in verified batches.                                                            |
| [ng-testing](.agents/skills/ng-testing/SKILL.md)                           | Writes **Vitest unit and component tests** for _Angular_ – TestBed on zoneless, signal assertions, HTTP mocking, CDK harnesses – with a red→green verify loop.                                                             |
| [update-skills](.agents/skills/update-skills/SKILL.md)                     | Checks vendored skills for upstream changes and applies requested updates while preserving local adaptations, recording reviewed revisions, and verifying snapshot digests.                                                |
| [update-skills-directory](.agents/skills/update-skills-directory/SKILL.md) | Audits `.agents/skills/` so every skill has **valid frontmatter, lean structure, and a one-to-one index link** – reports gaps, fixes on approval.                                                                          |
