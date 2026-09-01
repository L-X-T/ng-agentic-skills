---
name: update-skills-directory
description: Audit .agents/skills so every skill has valid frontmatter, a lean SKILL.md, flat support folders, and a root 02-SKILLS.md link. Use when the user adds, renames, removes, or restructures a skill, or asks to update the skills index/directory. Do not use it to create per-skill README files.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Update skills directory

Keep `.agents/skills/` aligned with agent-skill best practices: one `SKILL.md` per skill, optional
flat `references/`, `scripts/`, or `assets/` folders, and a repo-root `02-SKILLS.md` index. Skill
folders are agent artifacts, so do not create per-skill `README.md` files.

## Process

### 1. Enumerate

List every immediate subfolder of `.agents/skills/` and read `02-SKILLS.md` if it exists.

_Done when_ every skill folder and every current index entry is accounted for.

### 2. Audit each skill

For every skill folder, check:

- `SKILL.md` exists.
- Frontmatter has `name` matching the folder, using only lowercase letters, numbers, and hyphens.
- Frontmatter has a trigger-focused `description` under 1,024 characters, including for explicit-only skills.
- `SKILL.md` is under 500 lines and contains high-level procedure or routing, not bulky reference.
- Support files live in one-level-deep `references/`, `scripts/`, or `assets/` folders; supported harness metadata such as `agents/openai.yaml` is also allowed.
- `references/` links are explicit and loaded just in time.
- No per-skill `README.md` exists.
- No stray tool-call markup (`</content>`, `</invoke>`, `</output>`) anywhere in the skill's files.
- **Repo-state claims are detection, not assertion**: grep the skill for phrases like `not set up`,
  `not wired`, `not installed`, `is NOT in`, `no \`<file>\`` and verify each against the working
  tree; the stack's branches are rewritten regularly, so any hard-coded "this repo has/lacks X"
  eventually lies. Rephrase hits as "check for X; if present … / if absent …".
- **House-rule sweep** – the skills are the exemplar of the project rules, so grep every file in the
  skill for: an em dash (U+2014; the Markdown guide mandates the spaced en dash), `npm ` / `npx ` /
  `yarn ` commands (pnpm only – `pnpm add`, `pnpm exec`, `pnpm dlx`), `pnpm test` or `ng test`
  without `--watch=false`, `pnpm start` / `ng serve` without the dev-server approval sentence,
  untagged code fences, and links to repo-root files that do not exist.

_Done when_ each skill has pass/fail notes for structure, frontmatter, disclosure, house rules, and index status.

### 3. Audit the root index

Confirm `02-SKILLS.md` links every skill's `SKILL.md`, contains no stale skill entries, and records
third-party origins in the index rather than in per-skill docs.

_Done when_ the index is one-to-one with the skill folders present.

### 4. Report

Present a concise list of gaps: missing `SKILL.md`, invalid frontmatter, overlong `SKILL.md`,
nonstandard support files, stale links, missing index rows, house-rule violations, stale
`localSha256` digests in `skill-sources.json` (recompute with the convention in
`SKILL-MAINTENANCE.md`), and forbidden per-skill `README.md` files.

_Done when_ the user can see every gap at a glance.

### 5. Fix

With approval, make the smallest correction that restores the structure:

- Move bulky support material into `references/`, `scripts/`, or `assets/`.
- Update `SKILL.md` pointers to use relative paths with forward slashes.
- Remove per-skill `README.md` files after preserving any still-useful origin or catalogue text in
  `02-SKILLS.md`.
- Add missing index rows and remove stale rows.
- Replace em dashes, package-manager commands, and watch-mode test commands with the house form.
- Refresh `localSha256` for every third-party skill whose files changed.

Do not stage or commit unless the user explicitly asks.

_Done when_ every skill passes the audit and all local links resolve.

## Checklist

- [ ] Every skill folder has one `SKILL.md`.
- [ ] Frontmatter names match folder names and descriptions are trigger-focused.
- [ ] `SKILL.md` files stay under 500 lines.
- [ ] Support files are one level deep under `references/`, `scripts/`, `assets/`, or `agents/`.
- [ ] No em dashes, `npm`/`npx`/`yarn` commands, watch-mode test commands, or ungated dev-server starts.
- [ ] `skill-sources.json` digests match the third-party skill folders.
- [ ] No per-skill `README.md` files remain.
- [ ] `02-SKILLS.md` links every skill and no stale skill entries remain.
