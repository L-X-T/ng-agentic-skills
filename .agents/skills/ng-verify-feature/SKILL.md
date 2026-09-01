---
name: ng-verify-feature
description: Verify a running Angular feature against acceptance criteria using the browser, and report observed behavior with reproduction evidence. Use when the user asks to verify a delivered feature, check an Angular user flow, or perform scoped exploratory acceptance testing. Do not use for source-only code review, writing e2e specs, or a general explanation of browser testing.
license: Apache-2.0
metadata:
  upstream: vercel-labs/agent-browser dogfood
---

# Verify an Angular Feature

Adapted from Vercel's `dogfood`: checks a bounded feature against acceptance criteria using available
Chrome tools, replaces issue quotas with coverage, and preserves the user's browser and server sessions.
Upstream license: [references/LICENSE.txt](references/LICENSE.txt).

## 1. Define what must work

Read the task, approved design, or relevant acceptance criteria and the project's browser rules.
Identify the target route, changed behavior, and relevant user state. If criteria are implicit, derive
a small list of observable outcomes and state those assumptions. Ask only when an unresolved choice
would materially change what counts as correct.

Prepare a compact coverage table: criterion, action, expected result, observed result, status, evidence.
Use **pass**, **fail**, **blocked**, or **not tested**; empty evidence is never a pass. Keep exploration
within the feature and its directly affected flows.

_Done when_ the target and observable acceptance criteria are explicit.

## 2. Connect to the existing app

Check the project's configured URL for an existing server. Use the user-managed Chrome session and
available Chrome DevTools or browser tools, following the tool's connection instructions. Do not assume
agent-browser, Playwright, Cypress, or a particular debugging connection is installed or available.

Do not start a dev server or Chrome, install a browser runtime, or switch to an internal browser without
the required user authorization. When a prerequisite is missing, report exactly what is unavailable
and request it. You may inspect source and run permitted static checks while waiting, but label them
separately from browser evidence. Never treat a missing browser as a successful verification.

Use existing authenticated state where appropriate. Keep test mutations within the authorized scope
and disposable test data; do not send messages, make purchases, or change real user data merely to
exercise a flow. Do not export the user's authentication state into report files.

_Done when_ the intended route is reachable in the permitted browser, or dependent checks are blocked.

## 3. Exercise the feature

Inspect the rendered page before acting. Locate controls by accessible role, label, or observed text;
refresh the page state after navigation or substantial UI changes. Wait for the specific expected UI
state, not a fixed sleep or a universal network-idle condition.

Check the relevant cases from the coverage table:

- The main user journey and its persisted result, where persistence is part of the requirement.
- Empty, loading, error, disabled, and populated states that the feature actually supports.
- Form validation, keyboard operation, visible focus, and accessible labels.
- Navigation, direct links, and back/forward behavior when routes or query parameters changed.
- Relevant viewport sizes and realistic content lengths when layout changed.
- Console errors and failed requests associated with the exercised action.

Use available fixtures or authorized request interception to reach error states; record when a case
cannot be exercised. An automated accessibility scan supplements keyboard and visual checks. Do not
claim full WCAG conformance from a scan or from this bounded feature check.

_Done when_ every planned case has an observed result or a stated reason it could not be tested.

## 4. Capture findings as they happen

Record expected versus actual behavior, the route and relevant state, and minimal reproduction steps
while the context is fresh. Attach a screenshot, DOM/accessibility observation, or console/network
excerpt that demonstrates the result. Record video only when timing or interaction makes it useful.
Exclude credentials and sensitive content from evidence.

Retry an apparent failure when safe. Distinguish reproducible failures from intermittent observations;
retain uncertain observations with that qualification. Classify severity by user impact, and distinguish
acceptance failures from optional UX suggestions. Zero findings is a valid result; do not invent issues
to meet a quota.

_Done when_ each finding has evidence and enough context for another person to investigate it.

## 5. Report coverage and limitations

Return the coverage table and severity-ranked findings with evidence links. State the tested route,
user state, browser, and material limitations. Use the project's report location if one exists; create
a small report file only when the evidence or number of cases makes it useful.

A verification request does not authorize code changes. When fixes are already authorized, repair
within that scope and rerun affected cases before updating their status. Use the project's e2e skill
only when reusable test authoring is requested; browser inspection does not require adding a test runner.

Restore temporary viewport or test-state changes you made when safe, and leave the user's existing
browser and server running. Clean up only disposable data created for this verification.

_Done when_ the user can see which criteria passed, failed, were blocked, or remain untested, with
no completion claim stronger than the evidence.

## Example

“Verify the booking filter on the running app: cancelled bookings disappear, clearing the filter
restores them, and the filter is usable with the keyboard.”

Check those three outcomes in Chrome, capture failures at the point of interaction, and report any
unreachable state as blocked. A passing unit test alone does not satisfy these browser criteria.
