# OpenCode Instructions

Follow `../AGENTS.md` for the shared project rules. This file owns OpenCode model routing
and tool mechanics.

## Model routing – OpenCode

Use Claude Fable 5.1 as the orchestrator and GPT-6 Astra as the implementer. Fable plans,
designs, writes the brief, reviews, and reports to the user. All implementation goes to
`implement-astra`, including corrections after review; Fable does not patch the code itself.
This routing applies only to the OpenCode harness.

For an implementation request:

1. Fable inspects what it needs for the design and writes a self-contained brief: relevant
   files, exact behaviour and API, project constraints, and verification commands.
2. Launch `implement-astra` through the Task tool with that brief.
3. After a non-trivial change, launch `review-fable`, `review-opus`, and `review-astra` in
   parallel with the same diff and review instructions. Fable merges and deduplicates their
   findings and verifies each one against the code.
4. Send concrete corrections back to `implement-astra` until the requested change is verified.
   If a finding needs a new user decision, report it rather than expanding the scope.

For a review-only request, launch the same three reviewers and report the findings without
implementing fixes. Do not silently switch implementer models if Astra is unavailable; report
that limitation to the user.

## Mechanics

- The project defaults in `opencode.json` select `github-copilot/claude-fable-5.1` for the
  session and the `build` agent. When using T3 Code, also select Fable 5.1 there; an explicit
  app selection overrides the project model default.
- `implement-astra`, `explore`, and `review-astra` use `github-copilot/gpt-6-astra`.
  `review-opus` uses `github-copilot/claude-opus-5.5`; `review-fable` and `general` use
  `github-copilot/claude-fable-5.1`. Astra runs natively through Copilot here, not the Codex CLI.
- Bulk fact-finding goes to `explore`. Reserve `general` for questions requiring Fable-level
  judgement, never implementation or bulk exploration. Keep their conclusions in context,
  not their full transcripts.
- The Task tool takes the subagent name; its model comes from `opencode.json`. Never invent
  an undefined implementer or reviewer name.
- Keep implementation permissions on `implement-astra`; the reviewers report findings only
  and must not edit files or delegate further. Project verification and safety rules still
  apply. T3 Code can override main-session permission defaults, so do not treat them as
  proof that the main agent cannot edit.
- The user can address the configured subagents directly with `@implement-astra`,
  `@review-fable`, `@review-opus`, and `@review-astra`.

## Ports are links – hard rule

Every mention of a local port or server in a reply is a full clickable URL (`http://localhost:4200/register`), never a bare `:4200` or `4200`. Applies to every mention, in every reply, including status lines and summaries. See the dev-server rules in `../AGENTS.md`.
