# Feedback-loop catalogue

The full menu of loop shapes for Phase 1, in roughly the order to try them. The
first four are the concrete loops for this stack and live in `SKILL.md`; the rest
are here for when those don't reach the bug.

1. **Failing test** at whatever seam reaches the bug – vitest unit (`pnpm exec ng test --watch=false --include=<path>`)
   or Playwright e2e (`pnpm test:e2e` – if a `playwright.config.ts` exists; see `SKILL.md`).
2. **`curl` / HTTP script** against the already-running dev server
   (`http://localhost:4200`; never start `ng serve` yourself – see `AGENTS.md`).
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright) – drives the UI, asserts on
   DOM/console/network. For structured browser specs use the
   [`create-e2e-tests`](../../create-e2e-tests/SKILL.md) skill.
5. **Replay a captured trace.** Save a real network request / payload / event log to
   disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked
   deps) that exercises the bug code path with a single function call.
7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random
   inputs and look for the failure mode.
8. **Bisection harness.** If the bug appeared between two known states (commit,
   dataset, version), automate "boot at state X, check, repeat" so you can wrap it as
   a `git bisect run` predicate.
9. **Differential loop.** Run the same input through old-version vs new-version (or
   two configs) and diff outputs.
10. **HITL bash script.** Last resort. If a human must click, drive _them_ with
    [`scripts/hitl-loop.template.sh`](../scripts/hitl-loop.template.sh) so the loop is
    still structured. Captured output feeds back to you.
