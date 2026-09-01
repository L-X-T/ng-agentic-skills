---
name: test-driven-development
description: Drive implementation from a failing test first – red, green, refactor – so every line of production code is demanded by a test you watched fail. Use when implementing a feature or bugfix before writing implementation code, or when the user mentions TDD, red-green, "write the tests first", or "test-drive this".
license: MIT
metadata:
  upstream: obra/superpowers test-driven-development (see references/LICENSE.txt)
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

**Always:**

- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask your human partner):**

- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

**Test-setup gate (portability):** This repo has Vitest wired up for unit tests (`pnpm test --watch=false`), so TDD applies at the unit level. For e2e, **check for a `playwright.config.ts` before driving anything with an e2e spec**: on the workshop's teaching branches Playwright arrives later (with the demo solution), so if the config is absent, treat Playwright as to-be-configured; if it is present, `pnpm test:e2e` is your e2e loop. Per `AGENTS.md`, when a project has _no_ Vitest setup, do not write or modify `.spec.ts` files; likewise skip Playwright specs where no Playwright setup exists. No test harness, no TDD loop – raise that with your human partner first.

## Existing behavior and user-owned code

For new behavior, write a failing acceptance test first. For characterization of existing behavior,
a passing first run is expected: demonstrate red-capability with a scoped temporary mutation in an
isolated copy, then restore it and keep the real behavior intact. Never delete or rewrite user-owned
production code merely to manufacture a red test. Do not turn documentation or configuration edits
into artificial testing exercises. Existing session authorization and repository rules govern scope.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

If new behavior was implemented before its test, stop expanding it and establish a meaningful regression check. Preserve user-owned work.

**No exceptions:**

- Do not weaken a test to fit the implementation.
- Do not claim a red-green cycle that was not observed.
- Preserve existing code and comments while establishing the safety net.

For new behavior, implement from the tests. For existing behavior, characterize first, then change.

## Red-Green-Refactor

```dot
digraph tdd_cycle {
    rankdir=LR;
    red [label="RED\nWrite failing test", shape=box, style=filled, fillcolor="#ffcccc"];
    verify_red [label="Verify fails\ncorrectly", shape=diamond];
    green [label="GREEN\nMinimal code", shape=box, style=filled, fillcolor="#ccffcc"];
    verify_green [label="Verify passes\nAll green", shape=diamond];
    refactor [label="REFACTOR\nClean up", shape=box, style=filled, fillcolor="#ccccff"];
    next [label="Next", shape=ellipse];

    red -> verify_red;
    verify_red -> green [label="yes"];
    verify_red -> red [label="wrong\nfailure"];
    green -> verify_green;
    verify_green -> refactor [label="yes"];
    verify_green -> green [label="no"];
    refactor -> verify_green [label="stay\ngreen"];
    verify_green -> next;
    next -> red;
}
```

### RED - Write Failing Test

Write one minimal test showing what should happen.

**How to write the test itself is a separate skill.** For unit tests – Vitest + Angular `TestBed`, harnesses, fixtures – follow [`ng-testing`](../ng-testing/SKILL.md). For browser e2e specs, follow [`create-e2e-tests`](../create-e2e-tests/SKILL.md). This skill governs the _discipline_ (what order, watch it fail); those skills govern the _mechanics_ (how the spec is written).

<Good>

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

Clear name, tests real behavior, one thing

</Good>

<Bad>

```typescript
test('retry works', async () => {
  const mock = vi
    .fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```

Vague name, tests mock not code

</Bad>

**Requirements:**

- One behavior
- Clear name
- Real code (no mocks unless unavoidable)

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Run just the spec you're driving, not the whole suite:

```bash
pnpm exec ng test --watch=false --include=src/path/to/component.spec.ts   # single unit spec (Vitest)
pnpm test:e2e path/to/feature.spec.ts    # single e2e spec (Playwright – only once it's set up; see the test-setup gate)
```

Confirm:

- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

**Test passes?** If characterizing existing behavior, that is expected; prove red-capability with a temporary mutation. For missing new behavior, check that the assertion actually exercises the requirement.

**Test errors?** Fix error, re-run until it fails correctly.

### GREEN - Minimal Code

Write simplest code to pass the test.

<Good>
```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```
Just enough to pass
</Good>

<Bad>
```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI
}
```
Over-engineered
</Bad>

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN - Watch It Pass

**MANDATORY.**

```bash
pnpm exec ng test --watch=false --include=src/path/to/component.spec.ts
```

Confirm:

- Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

**Test fails?** Fix code, not test.

**Other tests fail?** Fix now.

### REFACTOR - Clean Up

After green only:

- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.

### Repeat

Next failing test for next feature.

## Good Tests

| Quality          | Good                                | Bad                                                 |
| ---------------- | ----------------------------------- | --------------------------------------------------- |
| **Minimal**      | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear**        | Name describes behavior             | `test('test1')`                                     |
| **Shows intent** | Demonstrates desired API            | Obscures what code should do                        |

## Why Order Matters

**"I'll write tests after to verify it works"**

Tests written after code pass immediately. Passing immediately proves nothing:

- Might test wrong thing
- Might test implementation, not behavior
- Might miss edge cases you forgot
- You never saw it catch the bug

Test-first forces you to see the test fail, proving it actually tests something.

**"I already manually tested all the edge cases"**

Manual testing is ad-hoc. You think you tested everything but:

- No record of what you tested
- Can't re-run when code changes
- Easy to forget cases under pressure
- "It worked when I tried it" ≠ comprehensive

Automated tests are systematic. They run the same way every time.

**"Deleting X hours of work is wasteful"**

Sunk cost fallacy. The time is already gone. Your choice now:

- Establish a real regression test now: observe red via a scoped temporary mutation, then green (high confidence)
- Keep it untested (low confidence, likely bugs)

The "waste" is keeping code you can't trust. Working code without real tests is technical debt.

**"TDD is dogmatic, being pragmatic means adapting"**

TDD IS pragmatic:

- Finds bugs before you surface the diff (faster than debugging after)
- Prevents regressions (tests catch breaks immediately)
- Documents behavior (tests show how to use code)
- Enables refactoring (change freely, tests catch breaks)

"Pragmatic" shortcuts = debugging in production = slower.

**"Tests after achieve the same goals - it's spirit not ritual"**

No. Tests-after answer "What does this do?" Tests-first answer "What should this do?"

Tests-after are biased by your implementation. You test what you built, not what's required. You verify remembered edge cases, not discovered ones.

Tests-first force edge case discovery before implementing. Tests-after verify you remembered everything (you didn't).

30 minutes of tests after ≠ TDD. You get coverage, lose proof tests work.

## Common Rationalizations

| Excuse                                 | Reality                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| "Too simple to test"                   | Simple code breaks. Test takes 30 seconds.                              |
| "I'll test after"                      | Tests passing immediately prove nothing.                                |
| "Tests after achieve same goals"       | Tests-after = "what does this do?" Tests-first = "what should this do?" |
| "Already manually tested"              | Ad-hoc ≠ systematic. No record, can't re-run.                           |
| "Adding tests now is wasteful"         | Keeping unverified code is technical debt. Establish the check now.     |
| "Keep as reference, write tests first" | Fine for user-owned code: characterize it, then prove red-capability.   |
| "Need to explore first"                | Fine. Keep the exploration out of the diff; start the real change TDD.  |
| "Test hard = design unclear"           | Listen to test. Hard to test = hard to use.                             |
| "TDD will slow me down"                | TDD faster than debugging. Pragmatic = test-first.                      |
| "Manual test faster"                   | Manual doesn't prove edge cases. You'll re-test every change.           |
| "Existing code has no tests"           | You're improving it. Add tests for existing code.                       |

## Red Flags - STOP and Reassess

- Code before test
- Test after implementation
- Test passes immediately for new behavior (expected only when characterizing existing behavior)
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual"
- "Keep as reference" or "adapt existing code"
- "Already spent X hours, deleting is wasteful"
- "TDD is dogmatic, I'm being pragmatic"
- "This is different because..."

**These are reasons to inspect the evidence and establish a meaningful test. They do not authorize deleting user-owned work.**

## Example: Bug Fix

**Bug:** Empty email accepted

**RED**

```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**Verify RED**

```bash
$ pnpm exec ng test --watch=false --include=src/app/registration/registration.spec.ts
FAIL: expected 'Email required', got undefined
```

**GREEN**

```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

**Verify GREEN**

```bash
$ pnpm exec ng test --watch=false --include=src/app/registration/registration.spec.ts
PASS
```

**REFACTOR**
Extract validation for multiple fields if needed.

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Establish the missing check before continuing.

When every box is checked, surface the diff (tests plus implementation) for review – the user commits. Never stage or commit on the agent's behalf.

## When Stuck

| Problem                | Solution                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Don't know how to test | Write wished-for API. Write assertion first. See [`ng-testing`](../ng-testing/SKILL.md). Ask your human partner. |
| Test too complicated   | Design too complicated. Simplify interface.                                                                      |
| Must mock everything   | Code too coupled. Use dependency injection.                                                                      |
| Test setup huge        | Extract helpers. Still complex? Simplify design.                                                                 |

## Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression. This is the regression-test phase that [`diagnosing-bugs`](../diagnosing-bugs/SKILL.md) hands off to.

Never fix bugs without a test.

## Writing Good Tests

Before writing or changing tests, read [references/writing-good-tests.md](references/writing-good-tests.md).
Name the production bug each test would catch, derive expectations independently, and exercise the
real behavior. This reference governs test quality; `ng-testing` and `create-e2e-tests` still own
framework mechanics.

For additional mocking examples, read [references/testing-anti-patterns.md](references/testing-anti-patterns.md):

- Testing mock behavior instead of real behavior
- Adding test-only methods to production classes
- Mocking without understanding dependencies

## Final Rule

```
Production code → test exists and failed first
Otherwise → not TDD
```

No exceptions without your human partner's permission.
