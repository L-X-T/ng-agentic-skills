---
name: handover
description: Compact the current conversation into a handover document for another agent to pick up. Use when the user wants to hand work over to a new session, says "handover", "hand off", or asks to summarise the session for the next agent.
argument-hint: 'What will the next session be used for?'
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Handover

Write a handover document summarising the current conversation so a fresh agent can continue the work. Save it to a fresh temp file: run `f=$(mktemp "${TMPDIR:-/tmp}/handover.XXXXXX") && mv "$f" "$f.md" && echo "$f.md"` and write to the printed path. The trailing `XXXXXX` is the only template BSD and GNU `mktemp` both expand, so the random part must sit at the end before the rename; never leave a literal `XXXXXX` in the filename.

Suggest the skills to be used, if any, by the next session – pick from the catalogue in `02-SKILLS.md` rather than guessing names.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

If the next session involves implementation, prototyping, architecture, or documentation, mention that the agent should follow `style-guide/style-guide.md` and load the relevant specific guide.
