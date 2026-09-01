---
name: update-skills
description: Check vendored skills for upstream updates and selectively apply requested updates while preserving local adaptations and provenance. Use when the user asks whether third-party skills are outdated, wants an upstream comparison, or asks to refresh installed skill copies. For directory structure and catalogue maintenance alone, use update-skills-directory.
license: MIT
---

# Update Skills

## 1. Establish scope

Use the user's request to choose the branch:

- **Check**: inspect and report; do not change skill files, the catalogue, or provenance records.
- **Update**: inspect first, then apply updates within the requested scope. Existing authorization
  is sufficient; ask only about an unresolved choice that would change intended behavior.

Default to the repository's vendored skills, not global skills or installed plugins. Read
`skill-sources.json`, the local adaptations in `02-SKILLS.md`, and the upstream-ledger section of
`SKILL-MAINTENANCE.md` at the repository root. For explicitly requested skills outside the ledger,
look for source metadata and installation records; do not infer an origin from a matching name.

_Done when_ the branch, selected skills, source repositories, and missing provenance are listed.

## 2. Establish the local baseline

Check the working-tree and staged state with read-only Git commands. From the repository root, run:

```bash
node .agents/skills/update-skills/scripts/check-digests.mjs
```

The script prints the recorded and current digest for each ledger entry without writing anything.
An optional argument selects another repository root. `changed` means local snapshot drift, not an
upstream update; `missing` means the skill folder is absent. Exit 1 reports either condition;
malformed input or read failures exit 2. Inspect relevant local differences before comparing upstream.
If the ledger is absent, continue source discovery and report the unavailable digest baseline.

_Done when_ every selected skill has a local snapshot and known local changes, or a named blocker.

## 3. Fetch and compare upstream

Resolve each source's current default-branch commit through its official repository API or read-only
Git inspection. Fetch files at that immutable revision into a temporary directory outside the checkout.
Reuse one repository snapshot for skills sharing an origin. Inspect upstream instructions and scripts
as comparison data; do not execute them or install dependencies to check for updates.

- Resolve the actual skill path, including renames and moves. Inspect referenced sibling skills when
  an entrypoint became a stub; do not silently replace the local skill with the stub.
- Compare the complete skill folder, including references, scripts, assets, metadata, and licenses.
  A repository's new HEAD is not evidence that its skill changed.
- **Recorded revision**: compare the recorded upstream folder with the current upstream folder,
  then check which changes are already represented locally. Use a three-way comparison for updates.
- **Unknown revision**: compare current upstream content with the local copy and documented
  adaptations. Separate missing upstream content from intentional local differences. Do not claim
  an exact number of updates behind, or label current HEAD as the original vendoring revision.
- Use path-specific history to explain substantive changes. Ignore formatting and relocated reference
  paths when assessing behavior, but still inspect executable-script differences.

If a source is unavailable or a path cannot be resolved, mark it **unverified** and continue with the
other skills. Never report a failed lookup as up to date.

_Done when_ every selected skill is classified as unchanged, upstream changes available, intentional
divergence, or unverified, with exact source revisions and evidence for the classification.

## 4. Report or apply

For **Check**, return a compact table of skill, status, substantive changes, and source links. Include
unchanged and unverified skills, the inspection date, and limits caused by unknown revisions. End here.

For **Update**, explain the selected changes, then apply the smallest relevant edits:

1. Read the applicable project style guides and the selected local files immediately before each edit.
2. Preserve the adaptations documented in `02-SKILLS.md`, user edits, existing comments, licenses, and
   attribution. Do not replace whole folders with upstream copies. Follow project rules for Git,
   package commands, browser/server startup, and tool permissions.
3. If upstream changes conflict with intended local behavior, state the concrete choice and ask only
   when the existing request does not resolve it. Continue independent authorized updates meanwhile.
4. Review changed scripts before running them. Validate changed instructions using the evaluation
   guidance in [references/evaluation.md](references/evaluation.md).

_Done when_ requested changes are applied, intentionally retained differences are explained, and
unresolved changes remain explicitly identified rather than silently skipped.

## 5. Verify and record updates

Format every touched file and run the project-required checks appropriate to the changes. Run
[update-skills-directory](../update-skills-directory/SKILL.md) for the structure and catalogue audit.
Re-read the ledger before editing it, then update only the affected entries:

- Record the exact reviewed `upstreamRevision`, `upstreamPath`, and inspection date. For selective
  adoption, explain in `revisionNote` which upstream changes were retained or omitted; this revision
  is the reviewed baseline, not a claim that the local copy is identical to upstream.
- Update documented adaptations if behavior changed, and record validation actually performed.
- Re-run the digest script after formatting and copy `currentSha256` into the relevant `localSha256`
  fields. It uses the digest convention defined in `SKILL-MAINTENANCE.md`.

Run the checker again against the final records. Report applied updates, intentional divergences,
unverified sources, check results, and any behavioral evaluation not performed. Do not claim that
reading instructions or matching hashes proves a skill behaves correctly in its host.

_Done when_ every updated entry matches its final files, catalogue links resolve, required checks
pass or blockers are reported, and the final diff contains only authorized changes.
