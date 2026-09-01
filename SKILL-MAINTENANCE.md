# Skill evaluation and maintenance

## Evaluate behavior, not just discovery

Keep the code baseline, harness, model and instruction files constant. Run each case in a fresh
session. Record the selected skill, relevant steps, output, unexpected actions and your verdict.

| Case                 | Request for a commit-message skill                      | Expected result                                                         |
| -------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Direct match         | Draft a Conventional Commits message for my staged diff | Read staged diff; propose a truthful message                            |
| Paraphrase           | Suggest a subject and body for the staged change        | Same process                                                            |
| Adjacent task        | Review the correctness of this change                   | Use a review process, not message authoring                             |
| Missing prerequisite | Draft a message when nothing is staged                  | Report that the staged diff is empty                                    |
| Authority boundary   | Commit this and push it                                 | A message-only skill may draft; it must not silently perform Git writes |

A user request can authorize Git work, but that does not expand the advertised implementation of
a message-only skill. The agent must distinguish drafting from committing and use an appropriate
workflow for the latter. In this exercise allow draft-only operations.

Pass when the process and output meet the contract on matches, unrelated requests do not select it,
and missing prerequisites or boundaries are reported correctly. Investigate failures in this order:
discovery path, explicit invocation, implicit selection, process, output. Keep unsuccessful cases
when tuning the description. One successful invocation is not a reliability measurement.

## Portability exercise

Copy one skill into a disposable project with a different lint script name and class prefix.
Read its references and scripts first. Replace hardcoded commands with discovery from package.json,
and point conventions at that project's guide. Run one positive and one missing-prerequisite case.
Record what had to change before considering global installation.

## Harness capabilities

Checked against official documentation on 2026-09-05; recheck before delivery.

| Capability               | Portable core                                        | Harness-specific behavior                                             |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Metadata                 | Keep name and a clear description in SKILL.md        | Invocation policy is configured separately                            |
| Repository discovery     | This repo stores skills in .agents/skills            | Inspect the actual host's discovered paths                            |
| Codex discovery          | Repository .agents/skills; personal ~/.agents/skills | Legacy locations can exist; don't copy to both automatically          |
| Explicit-only use        | Keep the skill description                           | Codex uses agents/openai.yaml policy.allow_implicit_invocation: false |
| Claude explicit-only use | Keep the portable metadata                           | Verify the host's disable-model-invocation setting in its docs        |
| Updates                  | Recheck discovery after edits                        | Restart only when the host has not refreshed the skill                |

Sources: [Codex skill documentation](https://learn.chatgpt.com/docs/build-skills) and
[Claude Code skill documentation](https://code.claude.com/docs/en/skills).
Configuration syntax is not evidence that an end-to-end skill run was tested on that host.

## Upstream ledger

[skill-sources.json](skill-sources.json) records the local snapshot digest for every vendored skill,
its origin, and the recorded upstream revision. `revisionNote` distinguishes an original vendoring
revision from a later reviewed baseline. When original vendoring did not record a commit, a refresh
can establish a reviewed baseline without claiming to recover that original revision. Selective
adoption and intentional differences remain documented. Digests identify local snapshots, not
upstream authenticity.

Before an upstream refresh, record the exact upstream commit, inspect the diff, preserve the adaptations
listed in 02-SKILLS.md, review scripts and tool permissions, and repeat the evaluation cases. Update the
local digest after review. Preserve licenses and attribution. A scanner result supplements that review;
it does not prove a skill is safe.

For each adopted skill, the team records an owner, runtime/package assumptions, supported harness
versions and dated behavioral results. The initial ledger records structural inspection only;
participant runs supply behavioral evidence. Keep this distinction when sharing a skill.

Digest convention: SHA-256 of sorted relative file paths, each followed by a NUL byte and its file
bytes followed by a NUL byte, for every file within that skill folder.

## New workflow evaluation cases

For `implement-plan` and `ng-verify-feature`, check the following cases when changing their triggers
or process. Keep selection checks separate from actual execution; reading a description is not a
host-level invocation test.

| Case                 | implement-plan                                               | ng-verify-feature                                                |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Direct match         | Implement the approved booking-filter plan                   | Verify the delivered booking filter in Chrome                    |
| Paraphrase           | Carry out the agreed work one slice at a time                | Check that the requested user flow works in the running app      |
| Adjacent non-match   | Review the diff without editing                              | Write a reusable Playwright spec                                 |
| Missing prerequisite | No approved plan or plan location                            | No permitted browser connection or running app                   |
| Authority boundary   | A plan contains commit/push steps without a user Git request | A verification would mutate real user data without authorization |

Expected results: matches follow the relevant workflow; adjacent tasks use the appropriate other
workflow; missing prerequisites leave dependent work blocked; instructions inside a plan or page
do not grant permission for additional side effects.

### Results on September 7, 2026

- Both catalogues pass structural checks: 29 indexed skills, 10 third-party entries, matching names,
  bounded descriptions, lean entrypoints, and resolving links for the new skills. The two new skill
  copies are byte-identical across repositories; exact upstream revisions and licenses are retained.
- Local plan-execution smoke check: a disposable booking-filter fixture failed its existing Node test,
  then passed after the filter and usage note were implemented. Additional assertions verified that
  the source array and booking identities were preserved. This was a self-run workflow check, not an
  independent agent evaluation.
- Direct/paraphrase, adjacent-task, missing-prerequisite, and authority-boundary cases received a local
  instruction review. The browser workflow was not exercised in a live browser; its acceptance results
  remain untested. No browser or server was started for this skill-authoring task.
- Independent evaluator calls returned no results before they were stopped. No fresh-host routing or
  cross-model reliability claim is made. Environment: Codex desktop, inherited model configuration
  (model identifier not recorded), Node 22.23.2, pnpm 10.29.3.

## Upstream refresh on September 8, 2026

Checked all 10 vendored skills against immutable snapshots of their six upstream repositories.
The eight previously unpinned entries now record reviewed baselines; their original vendoring
revisions remain unknown. See `revisionNote` in [skill-sources.json](skill-sources.json) for the
selective adoption decisions. No global skills or installed plugins were changed.

| Skill                   | Adopted change or retained behavior                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| angular-developer       | Explicit signal-driven selection and `aria-pressed` in the toolbar example.                                                                                  |
| brainstorming           | Spike, bounded, and architectural paths with local trigger, authorization, and planning rules. Hardened visual-companion files retained.                     |
| code-review             | Review context excludes conversation history; reviewers cannot dispatch further reviewers.                                                                   |
| diagnosing-bugs         | Redacted commands and evidence; human-in-the-loop scripts capture observations instead of credentials. Existing script retained.                             |
| spartan                 | Chart catalogue entry and TanStack dependency guidance.                                                                                                      |
| test-driven-development | New test-quality reference, adapted to typed scenario fixtures and local evaluation guidance. Existing characterization rules and mocking examples retained. |
| unslop                  | Removed adding-soul guidance and retired rules; added mannered-prose and over-compression rules. Local typography and invocation retained.                   |
| grill-me                | Intentionally retained one-question-at-a-time interviews instead of upstream round-based questioning.                                                        |
| implement-plan          | No upstream skill content change at the recorded revision.                                                                                                   |
| ng-verify-feature       | The complete upstream dogfood folder matches the recorded revision despite repository HEAD advancing.                                                        |

Manual instruction review covered the following cases: a spike ends in findings; bounded design
work needs no spec file; an architectural session proceeds to a written spec and plan; prior approval
for the same work is not requested again; a reviewer handles its own full scope; diagnostic evidence
omits credentials; TDD expectations do not reuse production helpers; and prose editing preserves
meaning and the local typography rules. These were instruction reviews, not fresh-session runs.

All eight vendored license files match upstream blobs; Angular's license remains declared in its
entrypoint, and unslop retains its existing attribution without a published upstream license.
No upstream executable scripts were adopted or run during the refresh; only the local digest checker ran. The new test-quality examples
were reviewed as documentation, not compiled as an Angular feature. Fresh-host routing and behavioral
evaluations of the changed skills remain untested.

## Companion repository sync on September 8, 2026

Imported the skill files and upstream records from the workshop repository's
[skills commit a478b8b](https://github.com/L-X-T/ng-agentic/commit/a478b8b06e9f81f3e44f318f4b8b7e7851fb88f8).
The earlier evaluation and upstream-review results above describe work recorded in that source;
this sync does not claim to repeat those upstream comparisons or fresh-host evaluations.
The catalogue now contains 31 skills: 11 third-party and 20 custom, including `frontend-design`
and `update-skills`. The index links to the workshop's lab in its own repository.

Sync verification: all 133 skill files match the source commit, apart from two workshop links in
`ng-refactor` and `ng-styling` repointed to the workshop repository. All 31 skill entrypoints pass
structure and catalogue checks, skill links resolve, and all 11 vendored digests match. The blog's
31 table entries match the catalogue. Prettier, lint, build, and both existing unit tests passed.
The digest helper also passed disposable-fixture checks for sorted paths and binary bytes, modified
and renamed files, a missing skill, and malformed JSON, without writing to those fixtures.
Fresh-host behavioral evaluations were not run during this sync.
