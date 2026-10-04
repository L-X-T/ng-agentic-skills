# Claude Instructions

Follow `../AGENTS.md` for the shared project rules. This file owns Claude Code model routing
and tool mechanics.

## Model routing – Claude Code

Use Claude Fable 5.1 as the session model. Fable handles planning, design, implementation,
investigation, and fixes itself. Any implementation subagent must also use Fable 5.1.
Do not delegate implementation or investigation to Opus or Astra, and do not use the Codex
CLI for those tasks. This routing applies only to the Claude Code harness.

### Reviews when requested

When the user asks for a review, run three independent reviewers in parallel:

- Claude Fable 5.1, via the Agent tool with `model: 'fable'`.
- Claude Opus 5.5, via the Agent tool with `model: 'opus'`.
- GPT-6 Astra, via the Codex CLI in read-only mode as described below.

Give all three the same diff, scope, project rules, and review instructions. They report
findings only; they must not edit files or launch further agents. For each finding require
severity (must/should/nit), file:line, a concrete defect, and a failure scenario.

Fable merges and deduplicates the reports and verifies findings against the code before
reporting them. A review request does not authorize applying its findings. When the user
asks for fixes, Fable implements them. Normal implementation still runs the project's
required checks, but does not automatically launch this three-model review.

### Astra review mechanics

Run Astra directly from Bash, with the model and read-only sandbox explicitly selected:

```shell
codex exec -m gpt-6-astra -s read-only -C <repo-root> -o <unique-report-file-in-/tmp> -
```

Pass the self-contained review prompt through stdin. Include the repository root, absolute
paths, the same review instructions as the Claude reviewers, and exactly which diff to
review: uncommitted changes, a branch comparison, or a specified commit. Embed the diff
when it cannot be recovered from that checkout.

Use a unique report file and run the command in the background alongside the two Claude
reviewers. Read the final report when it finishes. If a wrapper or connection fails, check
whether the Codex process is still running before retrying. Do not rely on the global Codex
model default or the global `codex-astra` wrapper, whose model and execution mode can differ.
Never use `--dangerously-bypass-approvals-and-sandbox`.

The Astra review prompt must forbid file edits, fixes, Git state changes, dev servers, and
package installs. It should inspect the supplied diff and report findings, not run formatting
or implementation commands.

## Ports are links – hard rule

Every mention of a local port or server in a reply is a full clickable URL (`http://localhost:4200/register`), never a bare `:4200` or `4200`. Applies to every mention, in every reply, including status lines and summaries. See the dev-server rules in `../AGENTS.md`.
