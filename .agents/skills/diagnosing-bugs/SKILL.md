---
name: diagnosing-bugs
description: Feedback-loop-first diagnosis discipline for hard bugs and performance regressions. Use when debugging, hunting a bug's root cause, chasing a flaky or failing test, or tracking down a regression – the user says "diagnose"/"debug this" or reports something broken, throwing, failing, or slow.
license: MIT
metadata:
  upstream: mattpocock/skills diagnosing-bugs (see references/LICENSE.txt)
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, check for an `ADR.md` at the repo root (or `docs/adr/`); when present,
read the decisions in the area you're touching. Skim the narrowest relevant `style-guide/` file – so
your mental model matches the intended design, not just the current code.

## Redact evidence

Before showing commands, outputs, or captured artifacts, replace secrets with `<REDACTED>`.
Read credentials from environment variables without printing their values. Quote only the lines
needed to diagnose the failure, excluding authentication headers from captured requests.
For human-in-the-loop scripts, capture observations; leave signing in to the user as a step rather
than capturing credentials. If the redacted evidence is insufficient, say what information is missing.

## Phase 1 – Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a **tight**
pass/fail signal for the bug – one that goes red on _this_ bug – you will find the
cause; bisection, hypothesis-testing, and instrumentation all just consume it. If
you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### The concrete loops for this stack

Reach for these first, in roughly this order:

1. **Failing vitest unit test** – the sharpest seam for logic bugs. Run one file
   with `pnpm exec ng test --watch=false --include=<path>` (`pnpm test --watch=false` runs the whole suite). See
   [`ng-testing`](../ng-testing/SKILL.md) for the how.
2. **Failing Playwright e2e spec** – for bugs that only show in a real browser.
   Check for a `playwright.config.ts` first: if it exists, `pnpm test:e2e` is
   this loop; if not (the workshop's teaching branches gain Playwright later),
   scaffold via [`create-e2e-tests`](../create-e2e-tests/SKILL.md) if you need it.
3. **`curl` against the already-running dev server** at `http://localhost:4200`.
   Per `AGENTS.md`, never start `ng serve` yourself – use the server the user has
   running, and only ask for approval if nothing answers on the port.
4. **`git bisect run`** when the bug appeared between two known-good/bad commits –
   wrap any of the above loops as the bisect predicate.

The full catalogue of loop shapes (headless harness, trace replay, property/fuzz,
differential, HITL) lives in [`references/feedback-loops.md`](references/feedback-loops.md).
Read it when the four above don't reach the bug.

Build the right feedback loop, and the bug is 90% fixed.

### Tighten the loop

Treat the loop as a product. Once you have _a_ loop, **tighten** it:

- Can I make it faster? (Narrow the test scope, skip unrelated init, cache setup.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop; a 2-second deterministic one
is tight – a debugging superpower.

### Non-deterministic / flaky bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger
100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake
bug is debuggable; 1% is not – keep raising the rate until it's debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to
whatever environment reproduces it, (b) a captured artifact (HAR file, log dump,
screen recording with timestamps), or (c) permission to add temporary
instrumentation. Do **not** proceed to hypothesise without a loop.

### Completion criterion – a tight loop that goes red

Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one
command** – a test invocation, a `curl`, a script path – that you have **already
run at least once** (paste the invocation and its output), and that is:

- [ ] **Red-capable** – it drives the actual bug code path and asserts the user's
      exact symptom, so it goes red on this bug and green once fixed. Not "runs
      without erroring" – it must be able to _catch this specific bug_.
- [ ] **Deterministic** – same verdict every run (flaky bugs: a pinned, high
      reproduction rate, per above).
- [ ] **Fast** – seconds, not minutes.
- [ ] **Agent-runnable** – you can run it unattended; a human in the loop only via
      [`scripts/hitl-loop.template.sh`](scripts/hitl-loop.template.sh).

If you catch yourself reading code to build a theory before this command exists,
**stop – jumping straight to a hypothesis is the exact failure this skill
prevents.** No red-capable command, no Phase 2.

## Phase 2 – Reproduce + minimise

Run the loop. Watch it go red – the bug appears.

Confirm:

- [ ] The loop produces the failure mode the **user** described – not a different
      failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for flaky bugs, at a
      high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow
      timing) so later phases can verify the fix actually addresses it.

### Minimise

Once it's red, shrink the repro to the **smallest scenario that still goes red**.
Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop
after each cut – keep only what's load-bearing for the failure.

Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving
parts left to suspect) and becomes the clean regression test in Phase 5.

Done when **every remaining element is load-bearing** – removing any one of them
makes the loop go green. Do not proceed until you have reproduced **and** minimised.

## Phase 3 – Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis
generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear /
> <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe – discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain
knowledge that re-ranks instantly ("we just deployed a change to #3"), or know
hypotheses they've already ruled out – a cheap checkpoint, big time saver. If you
want to be pushed on the ranking, run the [`grill-me`](../grill-me/SKILL.md) skill.
Don't block on it – proceed with your ranking if the user is AFK.

## Phase 4 – Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at
a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the
end becomes a single grep. Untagged logs survive; tagged logs die.

**Perf branch.** For performance regressions, logs are usually wrong. Instead:
establish a baseline measurement (timing harness, `performance.now()`, profiler,
DevTools trace), then bisect. Measure first, fix second.

## Phase 5 – Fix + regression test

Write the regression test **before the fix** – but only if there is a **correct
seam** for it. Follow the red-green discipline in
[`test-driven-development`](../test-driven-development/SKILL.md): use
[`ng-testing`](../ng-testing/SKILL.md) for a unit seam,
[`create-e2e-tests`](../create-e2e-tests/SKILL.md) for a browser seam.

A correct seam is one where the test exercises the **real bug pattern** as it occurs
at the call site. If the only available seam is too shallow (a single-caller test
when the bug needs multiple callers, a unit test that can't replicate the triggering
chain), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it – the codebase
architecture is preventing the bug from being locked down. Flag it for Phase 6.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail.
3. Apply the fix – keep it local per `AGENTS.md`; no opportunistic refactors.
4. Watch it pass.
5. Re-run the Phase 1 loop against the original (un-minimised) scenario.

## Phase 6 – Cleanup + post-mortem

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes/harnesses deleted (or moved to a clearly-marked debug location)
- [ ] Lint and the relevant tests pass (`AGENTS.md`)

Then **surface the diff and the root cause to the user – they commit, never you**
(repo hard rule: no staging or committing on the agent's own initiative). State the
hypothesis that turned out correct so the next debugger learns; if you're handing
the thread to a fresh session, use the [`handover`](../handover/SKILL.md) skill.

**Finally, ask: what would have prevented this bug?** If the answer is architectural
(no good test seam, tangled callers, hidden coupling), hand off to
[`ng-review-architecture`](../ng-review-architecture/SKILL.md) with the specifics.
Make that recommendation **after** the fix is in, not before – you have more
information now than when you started.
