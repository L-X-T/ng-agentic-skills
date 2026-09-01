---
name: ng-prototype
description: Build a throwaway Angular prototype to flesh out a design before committing – either a runnable terminal app for state/business-logic questions, or several radically different UI variations on one route, switchable from a floating bar. Use when the user wants to prototype an Angular feature, mock up a screen, sanity-check a data model or state machine, explore design options, or says "prototype this", "try a few designs", or "let me play with it".
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Angular prototype

A prototype is **throwaway code that answers a question**. The question decides the shape. This is the Angular path: prototypes live in this workspace's single Angular CLI app (`ng serve` / `ng build`, code under `src/app`) and follow its real patterns.

## Read first

Before editing, read only the relevant local style guide files – these and `AGENTS.md` override any generic example here or in the branch files:

- TypeScript: `style-guide/style-guide.ts.md`
- Templates: `style-guide/style-guide.html.md`
- SCSS: `style-guide/style-guide.scss.md`
- Accessibility (required for UI – AXE + WCAG AA): `style-guide/style-guide.a11y.md`

## Pick a branch

Identify which question is being answered – from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [references/logic.md](references/logic.md). A tiny interactive terminal app that drives the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [references/ui.md](references/ui.md). Several radically different UI variations on one Angular route, switchable via a `?variant=` query param and a floating bottom bar.

The two branches produce very different artifacts – getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default by the surrounding code (a service or data model → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules for both branches

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype next to where it will actually be used so context is obvious, but name it so a casual reader sees it's a prototype, not production. Obey the app's existing routing convention; don't invent a new top-level structure.
2. **One command to run.** Use the workspace runner – the dev server on `http://localhost:4200` for a UI prototype (reuse it when it answers; never start `pnpm start` / `ng serve` without explicit approval, per `AGENTS.md`); a `pnpm <name>` script for a terminal logic prototype. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it depends on. If the question is explicitly about persistence, hit a scratch store with a clear "PROTOTYPE – wipe me" name.
4. **Skip the polish.** No tests, no `.spec.ts`, no error handling beyond what makes the prototype _runnable_, no abstractions. Learn something fast, then delete it.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** Fold the validated decision into the real code or delete it – don't leave it rotting in the repo.

## When done

The _answer_ is the only thing worth keeping from a prototype. Capture it somewhere durable – a commit message, an ADR, an issue, or a `NOTES.md` next to the prototype – along with the question it was answering. If the user is around, that capture is a quick conversation; if not, leave the placeholder so the verdict can be filled in before the prototype is deleted. Each branch's final step then handles its own cleanup.
