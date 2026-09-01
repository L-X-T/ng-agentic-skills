---
name: grill-with-style
description: Grilling session that challenges your plan against the code's actual domain model and project style guide, and sharpens terminology. Use when the user wants to stress-test a plan against their project's language and style guide. For a plain design grilling without that lens use grill-me instead.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Grill with style

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

</what-to-do>

<supporting-info>

## Style guide awareness

Also look for a project style guide at `style-guide/style-guide.md`. If it exists, read it before asking implementation-facing questions. Load the specific guide files only when the plan touches that area:

- TypeScript or Angular component/service design: `style-guide/style-guide.ts.md`
- Angular templates, control flow, forms, or accessibility markup: `style-guide/style-guide.html.md`
- SCSS, design tokens, selectors, or component styling: `style-guide/style-guide.scss.md`
- NPM package choices or dependencies: `style-guide/style-guide.npm.md`
- Markdown documentation edits: `style-guide/style-guide.md.md`
- Git or commit planning: `style-guide/style-guide.git.md`
- Accessibility requirements or ARIA behaviour: `style-guide/style-guide.a11y.md`
- Unit or e2e test design: `style-guide/style-guide.spec.md`

When the user's plan conflicts with the style guide, call it out as a design constraint and ask for a decision. For example: "The style guide prefers signal inputs and the default `OnPush` change detection; does this plan require an exception, or should we reshape the component boundary?"

Do not quote or restate the full style guide. Use it to sharpen questions, identify constraints, and recommend project-consistent answers.

## During the session

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' – do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible – which is right?"

</supporting-info>
