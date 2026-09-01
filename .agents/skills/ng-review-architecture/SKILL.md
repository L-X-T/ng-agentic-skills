---
name: ng-review-architecture
description: Review the architecture of an Angular project against domain-driven design and module depth – bounded contexts, library categories (feature/ui/data-access/util/domain/api/shell), domain isolation, access restrictions, smart/dumb components, and deep vs shallow modules. Produces a structured review, then drills into chosen findings. Use when the user wants an Angular architecture review, to assess domain structure or boundaries, find refactoring or deepening opportunities, or check DDD/Nx layering and dependency rules.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Review Angular architecture

Review an Angular codebase against two lenses that compose:

- **Domain structure** (DDD): is the system carved into **bounded contexts** with isolated **domains**, the right **library categories**, and enforced **access restrictions**? Vocabulary and checklist in [references/ddd.md](references/ddd.md).
- **Module depth**: are the modules behind those seams **deep** (much behaviour behind a small **interface**) or **shallow** pass-throughs? Vocabulary in [references/language.md](references/language.md).

The frame that unites them: **bounded contexts name where the seams belong; depth measures the modules sitting behind them.** A finding can be a misplaced seam (DDD), a shallow module (depth), or both. Use the terms in references/ddd.md and references/language.md exactly – consistent language is the point, so don't drift into "component", "service", "API", or "boundary".

This review is _informed_ by the project's own domain model: a `CONTEXT.md` glossary names good seams, and ADRs record decisions the review must not re-litigate (check for a root `ADR.md` with `## ADR-NNN` sections or a `docs/adr/NNNN-title.md` folder; when neither exists, create `ADR.md` lazily on the first decision worth recording).

## 1. Explore

Read first – these and `AGENTS.md` override any generic example here:

- The project domain glossary (`CONTEXT.md`) and any ADRs touching the area under review.
- `style-guide/style-guide.md`, then the specific guides for the code being judged (`style-guide/style-guide.ts.md`, `style-guide/style-guide.html.md`, `style-guide/style-guide.scss.md`).

Detect the project shape, because it sets how the DDD model maps:

- **Nx monorepo** (`nx.json`, `apps/` + `libs/`): the library categories are real libs with `type:`/`scope:` tags enforced by `@nx/enforce-module-boundaries`.
- **Plain Angular app** (a single `angular.json` project): the same categories map to **feature folders** under `src/app`; access restrictions are conventions plus ESLint, not buildable-lib boundaries.

Then explore organically with the tools available (`rg`, the Nx project graph when present, focused reads); use multi-agent exploration only when that tooling actually exists. Note where you feel friction, against both lenses (full checklists in [references/ddd.md](references/ddd.md) and [references/language.md](references/language.md)):

- **Domain:** Can you name the bounded contexts? Do domains leak into each other except through a domain's `api`/`shell`? Is the `domain` layer free of infrastructure (data-access, HTTP, framework)? Are `feature` (smart) and `ui` (dumb) components separated? Is the **ubiquitous language** consistent, or do the same concepts wear different names across contexts?
- **Depth:** Where does understanding one concept require bouncing between many small modules? Where is a module **shallow** – its interface nearly as complex as its implementation? Apply the **deletion test** to anything you suspect is a pass-through: would deleting it concentrate complexity, or just move it?

## 2. Write the review

Open the report with a one-paragraph **domain map** – the bounded contexts you identified and the overall health – then a numbered list of findings, grouped by context/domain (or by lens when a finding is cross-cutting). For each finding:

- **Where** – the files, libraries, or feature folders involved.
- **Problem** – the friction, named in DDD and depth terms (e.g. _"the `booking` domain reaches into `boarding`'s data-access directly, bypassing its `api` seam"_, or _"`PricingService` is a shallow pass-through with no locality"_).
- **Recommendation** – the plain-English change: where the seam should sit, which category the code belongs in, what the deepened module's interface would look like.
- **Benefits** – in terms of **domain isolation**, **access restrictions**, **locality**, **leverage**, and how testability improves through the interface.

Use `CONTEXT.md` vocabulary for the domain, [references/language.md](references/language.md) for architecture, [references/ddd.md](references/ddd.md) for structure, and the style guide for code-shape constraints. If a finding contradicts an existing ADR, surface it only when the friction is real enough to reopen the ADR, and mark it clearly (_"contradicts ADR-0007 – worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

End with: **"Which finding would you like to explore?"** Do **not** propose detailed interfaces yet.

## 3. Drill in (grilling loop)

Once the user picks a finding, walk the design tree with them – constraints, dependencies, where the seam sits, what lives behind it, what survives in tests. Side effects happen inline as decisions crystallize:

- **Naming a module or domain after a concept not in `CONTEXT.md`?** Add the term (create `CONTEXT.md` lazily if absent) – format below.
- **Sharpening a fuzzy term mid-conversation?** Update `CONTEXT.md` right there.
- **User rejects a finding with a load-bearing reason a future reviewer would need?** Offer to record an ADR so the next review doesn't re-suggest it (format below). Skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **Exploring alternative interfaces for a deepened module?** See [references/interface-design.md](references/interface-design.md). Classify the module's dependencies and pick a verification strategy with [references/deepening.md](references/deepening.md). Per `AGENTS.md`, tests are written deliberately: when a drill-down needs a verification spec and a test setup exists, write it via [ng-testing](../ng-testing/SKILL.md) or [create-e2e-tests](../create-e2e-tests/SKILL.md); never scaffold specs as filler.

### CONTEXT.md entry format

```
## <Term>
<One-sentence definition in the project's own words.> Bounded context: <which>. Avoid: <terms it must not be confused with>.
```

### ADR format (root `ADR.md` section by default, or `docs/adr/NNNN-title.md` where that layout already exists)

```
# ADR-NNNN: <decision>
Status: accepted · Date: <YYYY-MM-DD>

## Context
<the friction and constraints>

## Decision
<what was decided>

## Consequences
<trade-offs, and why future reviews should not re-suggest the rejected alternative>
```
