---
name: ng-review-style-guide
description: Audit the whole Angular codebase against the project style guide (all of style-guide/, auto-selected by file type) and report severity-ranked conformance findings, then drill in and fix on approval. Use when the user wants a full-codebase style-guide review, a conformance audit, to check the existing code against the style guide, or to find where the codebase drifted from the guide – as opposed to reviewing a diff (use code-review) or only SCSS/styling (use ng-styling).
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Review the codebase against the style guide

The other review skills are scoped to a slice of the work: [`code-review`](../code-review/SKILL.md)
judges a **diff** (changed / staged / last-commit / PR), and [`ng-styling`](../ng-styling/SKILL.md)
goes deep on **SCSS / styling**. This skill is the **whole-codebase conformance sweep**: how far
has the code already in `src/` drifted from the project's written style guide, across _every_
relevant guide at once?

The style guide is the law here. The guides under [`style-guide/`](../../../style-guide/style-guide.md)
are the **sole source of truth** – read them, judge against them, cite them. Do not invent rules
from general Angular knowledge; if a rule isn't in the guide (or in `AGENTS.md`), it isn't a
finding. `AGENTS.md` and the project guides override any generic example in this skill.

The audit is the default and is **read-only**. Fixing is opt-in, one finding at a time, after you
approve it.

## Severity (mirrors the style guide)

| Severity        | Means                                          | Maps to                                                        |
| :-------------- | :--------------------------------------------- | :------------------------------------------------------------- |
| 🔴 **Must**     | A violation – fix it                           | the guide's **"Must do" / "Don't"** and `AGENTS.md` hard rules |
| 🟡 **Should**   | A strong recommendation – fix unless justified | the guide's **"Should do"**                                    |
| 🔵 **Advisory** | An opportunity to consider                     | softer "prefer" / "consider" wording                           |

## Process

### 1. Scope & inventory

Default scope is the **whole codebase** (`src/`). Accept a narrower scope when the user names one
(a path, a feature folder, a component). This is a plain Angular app (single `angular.json`, no
`nx.json`); judge against feature folders, not buildable libraries.

Inventory which **file types actually exist** in scope, because that decides which guides load in
step 2. Use a fast sweep, e.g.:

```bash
git ls-files src | sed 's/.*\.//' | sort | uniq -c
```

_Done when_ the scope is fixed and every file type present is listed with a count.

### 2. Load the guides (auto-selected by file type)

Read [`style-guide/style-guide.md`](../../../style-guide/style-guide.md) first – the baseline
applies to everything. Then load **only** the specific guides for file types found in step 1, and
record an explicit _not-applicable_ note for the rest:

| File type / signal                  | Guide                                                             |
| :---------------------------------- | :---------------------------------------------------------------- |
| `.ts` (components, services, logic) | [`style-guide.ts.md`](../../../style-guide/style-guide.ts.md)     |
| `.html` templates                   | [`style-guide.html.md`](../../../style-guide/style-guide.html.md) |
| `.scss` / styling                   | [`style-guide.scss.md`](../../../style-guide/style-guide.scss.md) |
| templates / interactive UI          | [`style-guide.a11y.md`](../../../style-guide/style-guide.a11y.md) |
| `.spec.ts`, e2e tests               | [`style-guide.spec.md`](../../../style-guide/style-guide.spec.md) |
| `package.json`, dependency files    | [`style-guide.npm.md`](../../../style-guide/style-guide.npm.md)   |
| `.md` documentation                 | [`style-guide.md.md`](../../../style-guide/style-guide.md.md)     |

Git workflow ([`style-guide.git.md`](../../../style-guide/style-guide.git.md)) is about commits and
branches, not files in the tree – skip it for a codebase audit unless the user asks.

_Done when_ the baseline plus every applicable specific guide is loaded, and skipped guides are
noted as not-applicable.

### 3. Run deterministic checks

Use configured static checks and deterministic searches before manual review. They are evidence, not
the whole audit: every hit must be read in context before it becomes a finding.

Run lint only when the project has a lint target. Resolve commands from `package.json` / workspace
config (`pnpm lint` or `ng lint`), and record pass/fail
output. Do not run tests, builds, formatters, fixers, e2e checks, or dev servers during the read-only
audit unless the user explicitly asks.

Search for likely guide violations with `rg`, then confirm or reject each hit against the loaded
guide:

- TypeScript / Angular: decorator APIs replaced by signal APIs, `standalone: true`, avoidable
  lifecycle hooks, `@HostBinding` / `@HostListener`, `any`, debug logging, direct
  `NodeListOf` / `HTMLCollectionOf` iteration, non-signal data-fetching patterns.
- Templates / a11y: `ngClass` / `ngStyle`, structural directives, template function calls, missing
  button `type`, non-semantic click targets, ARIA or focus-management drift.
- SCSS signals – see the [`ng-styling`](../ng-styling/SKILL.md) skill and
  [`style-guide.scss.md`](../../../style-guide/style-guide.scss.md) for the specific rules to search.
- Tests / docs / packages: only when those file types are in scope, check against their loaded guide.

_Done when_ lint results are recorded and every deterministic hit is confirmed, rejected, or
downgraded to a signal with evidence.

### 4. Audit

Turn each loaded guide into concrete checks and sweep the scope against them. Drive detection with
`rg` and targeted reads; for a large codebase, fan out read-only explorer subagents when available by
area or file type so breadth doesn't blow the context – each returns its findings, you consolidate.
Most guide rules are caught by reading and reasoning, not by a linter.

For **every finding** record: **severity · guide (e.g. `[ts]` / `[html]` / `[scss]`) · `file:line` ·
the rule · what's wrong · suggested fix · fixable = mechanical | judgment**.

Be honest about the bound: account for every file type in scope, not just the easy ones. A clean
guide is a valid result – say "no findings against `[spec]`" rather than omitting it.

_Done when_ every applicable guide has been swept across the full scope, deterministic signals are
resolved, and findings are recorded in that shape (or the guide is recorded as clean).

### 5. Report

Render a grouped Markdown report. Group by guide; within each group lead with 🔴 Must, then
🟡 Should, then 🔵 Advisory. Open with a one-paragraph **conformance summary** (overall health,
which guides are clean, where the drift concentrates) and close with per-severity counts and a
suggested fix order.

Write the full report to **`reports/ng-review-style-guide/current.md`** so drift is tracked over
time, then give a short chat summary (per-severity counts plus the report path). This artifact is
the **only** write the audit makes – read the existing `current.md` first if it exists and overwrite
just that file; touch no source, test, config, or other files while writing it. If the user would
rather keep the report in chat only, skip the file.

End with: **"Which finding would you like to fix?"** Do **not** start fixing yet.

_Done when_ the report is written to `reports/ng-review-style-guide/current.md` (or kept in chat by
request), the chat summary carries the same per-severity counts, every finding cites its guide and
`file:line`, no source files were touched, and the run has stopped for the user to choose.

### 6. Drill in & fix on approval

Only after the user picks a finding. Fix in **small, verified, single-purpose batches** – one
coherent kind of change per batch – honoring `AGENTS.md`: minimal diffs, no opportunistic refactors,
preserve existing comments and user edits, re-read each file immediately before editing.

After every batch run non-mutating verification and don't proceed until green:

**build (`pnpm build`) → lint (`pnpm lint` or project lint) → format check on touched files
(`pnpm exec prettier --check <files>`) → test (`pnpm test --watch=false`, only if behavior or templates changed)**

If a formatter or lint fixer is needed, run it only on the touched files after re-reading them; never
run repo-wide `pnpm format` or broad `--fix` commands during a skill fix batch. Read each diff
top-to-bottom; every edit must move the code closer to the guide and earn its keep. Re-audit the
touched scope so it shows clean. Then return to the report for the next finding.

_Done when_ each chosen finding is fixed and verified, explicitly deferred, or rejected with
evidence – and the working tree is left for the user to stage and commit.

## Guardrails (non-negotiable)

- **Guide is the only law.** Cite a guide for every finding. No guide rule, no finding – don't
  smuggle in general Angular opinions. Severity follows the guide's own Must/Should wording.
- **Audit first; fixing is opt-in.** A run touches no source code until the user approves a specific
  fix. The audit's only write is the report artifact at `reports/ng-review-style-guide/current.md`.
- **No big-bang rewrite.** Small, reviewable, single-purpose batches – never a sweeping codebase
  conformance edit.
- **Minimal diffs.** Change only what the finding requires. No "while I'm here" cleanups (`AGENTS.md`).
- **Preserve meaning.** Keep existing comments, documented workarounds, and user edits intact.
- **Treat the agent like a junior.** "Done" means the diff was read by a human, not that the agent
  said so.
- **Git discipline.** Never stage, commit, or push, and never start a dev server – surface the diff
  and let the user commit.

## Pairs with

- [`code-review`](../code-review/SKILL.md) – the diff-scoped counterpart; use it for changed/staged/
  PR work, this skill for the standing codebase.
- [`ng-styling`](../ng-styling/SKILL.md) – go here when the SCSS/styling findings warrant a deep,
  appearance-preserving fix pass against the three styling sources of truth.
- [`ng-accessibility`](../ng-accessibility/SKILL.md) – deeper a11y remediation beyond the
  `[a11y]` guide checks.
- [`ng-review-architecture`](../ng-review-architecture/SKILL.md) – when drift is structural (domain
  boundaries, module depth) rather than per-file style.

## Origin

Authored in this repository against Alexander Thalhammer's project style guide
([`style-guide/`](../../../style-guide/style-guide.md)). MIT-licensed.
