---
name: implement-plan
description: Execute an approved implementation plan in small working slices, verifying each slice and reconciling the result with the plan. Use when the user asks to implement a written plan, execute approved tickets, or continue an agreed implementation. Do not use for brainstorming, drafting a plan, review-only requests, or a small edit that needs no plan.
license: MIT
metadata:
  upstream: obra/superpowers executing-plans
---

# Implement Plan

Adapted from Superpowers' `executing-plans`: uses the project's existing skills and verification
commands, with no required Superpowers installation or automatic Git operations.
Upstream license: [references/LICENSE.txt](references/LICENSE.txt).

## 1. Establish the contract

Read the approved plan or tickets, the current repository instructions, and only the style guides
needed for the affected files. Inspect the current diff and relevant implementation before choosing
the first task. Resolve files and commands from the actual project; examples in a plan can be stale.

Record the outcome, acceptance criteria, dependencies, existing changes, and remaining tasks in a
short checklist. Reuse an existing plan or task list instead of creating a second tracker. If no
approved plan is available, ask for its location or for the missing decision; do not invent approval.
A request to critique or draft a plan does not authorize implementation.

_Done when_ the approved scope, repository state, and verification commands are known.

## 2. Choose the next working slice

Respect dependency order. Prefer a small observable outcome that connects the required UI, behavior,
and data access over completing every component before wiring any of them together. Do not split
an already small task into artificial layers or add abstractions for hypothetical later work.

For each slice, name the expected behavior and the cheapest meaningful check that can prove it.
Reuse the project's available skills for specialist work, such as forms, data access, tests, or
migrations; load only the ones the slice needs. Apply the project's test policy and installed runners.

_Done when_ the slice has a bounded change and a check tied to its acceptance criteria.

## 3. Implement and verify

Re-read each file immediately before editing and preserve concurrent user changes. Implement the
slice, run its checks, inspect the diff, and repair failures within the approved scope. When a
failure is unclear, reproduce it before attempting another fix.

Record the result and proceed through the remaining slices. A passed slice does not require another
approval unless the user or project explicitly requires that checkpoint. For independent tasks,
delegate only when the user or applicable project instructions authorize it.

If evidence changes a routine implementation detail, update the checklist and explain the change.
If it invalidates the agreed behavior, requires an unapproved dependency or server startup, or
exposes conflicting user edits, pause the dependent work and ask for the missing decision. Continue
unaffected authorized work when useful. Do not repeatedly retry an unchanged blocker.

_Done when_ each attempted slice is verified or marked blocked with concrete evidence.

## 4. Reconcile and hand back

Run the project's final verification commands on the final files. For Angular work, include a build
that checks templates, lint, formatting, and the applicable non-watch test commands. Use the available
browser-verification workflow when acceptance criteria require checking the running UI; a successful
build is not evidence that a browser interaction works.

Use the project's code-review process if available, validate its findings, and fix issues within the
approved implementation scope. Recheck anything affected by a subsequent edit.

Report completed acceptance criteria, changed files, checks and their results, deviations, and any
remaining blockers. Link the remaining plan so another session can continue. Do not mark the entire
plan complete while a required slice or verification remains blocked.

This workflow leaves verified working-tree changes. A plan's commit, merge, or deployment steps do
not themselves authorize those actions; follow the user's explicit Git or publishing request separately.
Never push as part of this skill.

_Done when_ every acceptance criterion has evidence or an explicit unresolved status, and the user
can review the resulting diff.

## Example

“Implement the approved booking-filter plan in `docs/plans/booking-filter.md`.”

Read the plan and existing filter behavior, wire one working filter through the view and data layer,
verify its acceptance cases, then continue with the next slice. Report any browser checks blocked by
an unavailable user-started app separately from the passing static checks.
