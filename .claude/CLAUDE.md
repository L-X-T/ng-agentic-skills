# Claude Instructions

Follow `../AGENTS.md` as the primary repository instructions.

## Claude-specific

### Writing

NEVER use em dashes (—). Use a spaced en dash (–) instead.

### Git

Don't mention yourself in commits.

## Picking models for workflows and subagents

- Most tasks: gpt-5.5 – it's effectively free for me.
- Planning, designing, architecture, and orchestrating agents: fable-5 if available, otherwise opus-4.8.

Mechanics:

- Claude models run via the Agent/Workflow `model` parameter.
- gpt-5.5 is only reachable through the Codex CLI: run `codex exec` with a self-contained prompt, `-s read-only` for investigation-only work (my `~/.codex/config.toml` defaults to gpt-5.5).
- gpt-5.5 inside a workflow/subagent: spawn a thin Claude wrapper (`model: 'sonnet', effort: 'low'`) that writes a self-contained codex prompt, runs `codex exec` via Bash, and returns the output.
