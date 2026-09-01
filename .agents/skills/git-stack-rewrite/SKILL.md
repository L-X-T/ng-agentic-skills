---
name: git-stack-rewrite
description: Fold staged changes or an existing commit into an older Git commit and rebase every affected dependent branch stack onto the rewritten commit. Use when the user says prompts like "use git stack rewrite to squash commit [source] into [target]", or asks to squash, fixup, amend, or move staged changes back into an earlier commit and then rebase branches that were on top of it.
license: MIT
metadata:
  author: Alexander Thalhammer
  version: '1.0'
---

# Git Stack Rewrite

Use this skill for history rewrites where staged changes or an existing source commit must be folded into an older target commit and branch stacks must be moved onto the rewritten replacement commit.

Supported prompt forms:

- `use git stack rewrite to squash commit [<source-commit>] into [<target-commit>]`
- `use git stack rewrite to fold the staged change into [<target-commit>]`

## Rules

- Treat this as destructive history rewriting even when it is local-only.
- Do not push unless the user explicitly asks.
- Never skip affected-branch discovery. Rewriting a base commit invalidates every branch on top of it, not only the branch currently checked out.
- In commit-to-target mode, the source commit must be reachable from the branch stack being rewritten, and normally must be a descendant of the target commit. Stop and explain if that ancestry is not true.
- Create backup refs before moving branch heads.
- Preserve user work. If the worktree has unrelated unstaged or untracked changes, report them and avoid touching them.

## Workflow

1. Inspect state:
   - `git status --short --branch`
   - Record the starting branch with `git rev-parse --abbrev-ref HEAD`; the workflow ends by switching back to it.
   - For staged-to-target mode: `git diff --cached --stat` and `git diff --cached --check`
   - For commit-to-target mode: `git show --stat <source-commit>` and `git diff --check <source-commit>^..<source-commit>`
   - `git show --no-patch --format='%H%n%P%n%s' <target-commit>`
   - For commit-to-target mode: `git show --no-patch --format='%H%n%P%n%s' <source-commit>`

2. Identify branch topology:
   - List requested branches and their heads with `git rev-parse`.
   - Find all local branches affected by rewriting the target:
     `git branch --contains <target-commit> --format='%(refname:short)'`
   - In commit-to-target mode, also find branches that contain the source:
     `git branch --contains <source-commit> --format='%(refname:short)'`
   - Include every branch the user named.
   - Also rebase other affected local branches when the user asked for all affected branches; otherwise report extra affected branches and ask before moving branch heads outside the user's stated scope.
   - Determine stack order from nearest to farthest descendant of the target commit. Use `git log --graph --decorate --oneline --all` or `git merge-base --is-ancestor` checks when needed.

3. Create backup refs:
   - For each branch that will move, create a local backup branch such as:
     `git branch backup/rewrite-<target-short>-<safe-branch-name> <branch>`
   - If the backup branch already exists, choose a unique suffix instead of overwriting it.

4. Prepare the change to fold into the target:
   - Staged-to-target mode: create a temporary fixup commit from the staged changes:
     `git commit --fixup=<target-commit>`
   - Commit-to-target mode: use the source commit directly as the fixup commit.
   - Record the fixup/source commit id.

5. Rewrite the target commit:
   - `git switch --detach <target-commit>`
   - `git cherry-pick --no-commit <fixup-or-source-commit>`
   - `git commit --amend --no-edit`
   - Record the new replacement commit id.

6. Rebase branches in stack order:
   - For staged-to-target mode, replay all commits above the old target while dropping the temporary fixup commit from step 4 (its patch is now in the new target); if the fixup commit sits on a branch being rebased, use the same interactive, `GIT_SEQUENCE_EDITOR`-driven rebase as below and remove it from the todo.
   - For commit-to-target mode, replay commits above the old target while dropping the source commit because its patch is now folded into the new target. Prefer interactive rebase with `--rebase-merges` disabled unless merge commits are part of the branch stack. Whenever `-i` is used, always drive it non-interactively via `GIT_SEQUENCE_EDITOR` (or an explicit todo) after inspecting the commit list – a bare `git rebase -i` opens an editor and blocks in an agent context.
   - For a simple linear stack in commit-to-target mode, a safe pattern is:
     1. Create the new target as above.
     2. Rebase the nearest affected branch with `git rebase -i --onto <new-target> <old-target> <branch>` and drop `<source-commit>` from the todo.
     3. Rebase later stacked branches with `git rebase --onto <rebased-parent-branch> <backup-of-old-parent-branch> <branch>`.
   - For staged-to-target mode, the first branch above the target can use:
     `git rebase --onto <new-target> <old-target> <branch>`
   - For each later stacked branch:
     `git rebase --onto <rebased-parent-branch> <backup-of-old-parent-branch> <branch>`
   - If a branch was affected but is independent of the named stack, rebase it with the nearest correct old base from its backup topology. In commit-to-target mode, also ensure the source commit is dropped from that branch if present.

7. Verify:
   - `git status --short --branch`
   - For each moved branch:
     - `git merge-base --is-ancestor <new-target> <branch>` must pass.
     - `git merge-base --is-ancestor <old-target> <branch>` should fail unless an intentional side branch still contains it.
     - In commit-to-target mode, `git merge-base --is-ancestor <source-commit> <branch>` should fail unless an intentionally untouched branch still contains it.
   - Compare old and new tip trees when useful:
     `git diff --stat <backup-branch>..<branch>`
   - Confirm the intended change is present in the rewritten target commit with `git show --stat <new-target>`.
   - Switch back to the starting branch recorded in step 1 (`git switch <starting-branch>`); never leave HEAD detached or on a branch the user did not start from.

8. Report:
   - Old target commit id, source/fixup commit id, and new replacement commit id.
   - The branch HEAD was returned to.
   - New branch heads.
   - Backup refs created.
   - Any affected branches intentionally not rebased.
   - Verification commands run and their result.
   - Push implications: rewritten branches with remotes will need force-with-lease pushes if the user wants to publish them.

## Staged-Only Shortcut

For staged-only changes with no dependents, steps 4–6 reduce to: fixup commit → detach/cherry-pick/amend → rebase the affected branches in stack order.
