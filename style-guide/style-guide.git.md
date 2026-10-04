# Git Style Guide

Last updated on 2026-09-07.

This document contains guidelines for Git usage.

## Do

### Must do

- before committing
  - optimise imports
  - run Prettier: `pnpm format` (the pre-commit hook covers staged files)
  - run `pnpm lint` and fix errors & warnings
  - run `pnpm build` and `pnpm test --watch=false`
- branch names
  - `feature/short-description` (e.g. `feature/booking-filter`)
  - `fix/short-description`
  - prefix the ticket number when there is one (`feature/1234-booking-filter`)
- use [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/)
- commit message header should be `type(scope): short description`
- commit message types
  - **a11y**: A code change that improves accessibility
  - **build**: Changes that affect the build system or external dependencies (e.g. updates, package dependencies)
  - **chore**: Routine maintenance not touching src/test (deps, config, tooling)
  - **ci**: Changes to our CI configuration files and scripts
  - **docs**: Documentation only changes
  - **feat**: A new feature
  - **fix**: A bug fix
  - **perf**: A code change that improves performance
  - **refactor**: A code change that neither fixes a bug nor adds a feature but improves the code
  - **revert**: Reverts a previous commit
  - **style**: Formatting/whitespace only, no behavior change (not CSS)
  - **test**: Adding missing tests or correcting existing tests
- commit message description can be used to include details
- atomic but reasonable commits
- use **LF endings**, no auto conversion `auto-crlf`

## Don't

- don't change branches that have been assigned to a review(er)
- don't amend commits if there are findings in a review, the reviewer must be able to continue their review from the last commit they already reviewed; also no rebasing at this stage

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Back to index

- [Angular Coding Style Guide](style-guide.md)
