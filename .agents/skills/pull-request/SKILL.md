---
name: pull-request
description: Defines nestia branch, commit, pull-request, check, and merge workflows. Use when the user explicitly asks to open, submit, update, or merge a pull request, or when a standing autonomous mandate authorizes end-to-end delivery; never open, push, update, or merge one on unprompted initiative.
---

# Pull Request Submission

Act on this skill only when the user explicitly requests the corresponding remote action, or when a standing autonomous mandate authorizes it. Permission to edit locally is not permission to push or open a pull request, and permission to open or update is not permission to merge. The one exception is a standing autonomous mandate — an autonomous or remote-control campaign, or an explicit instruction to carry the work through merge: it is the request for every step it names, including push and merge, and the skill's check, verification, and self-review gates still apply to each step.

For an explicit continuation under issue #1775, follow [its campaign procedure](../multi-agent/campaign-1775.md): keep the existing branch, pull request and checkout, with ordinary CI. Generic new-branch, worktree and CI-cancellation instructions do not apply to that campaign.

## Branch From The Target

Branch from the pull-request target (`master` unless stated otherwise); never commit or push directly to the target. Name the branch for the merged outcome with the repository's established type and scope, such as `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, or `ci/<scope>`.

Solo work never creates a clone or worktree; only an explicit multi-agent campaign batch owns one. If the current checkout contains unrelated or protected work, stage only the authorized paths; if that cannot keep the pull request isolated, report the conflict rather than stashing, reverting, mixing, or relocating the work.

## Commit Logical Units

Use one commit per coherent unit when the diff is large. Follow the repository's `<type>(<scope>): <subject>` history with an imperative lowercase subject and no trailing period.

Run the validation the development skill requires. [Formatting](../development/SKILL.md#work-rules) belongs to the final changes before merge, not to each commit or push.

Stage explicit paths when the worktree is mixed. Never include unrelated user changes silently.

## Write The Pull Request

Write the body at open as the historical intent statement. Include the intent, scope, deferred items, and exact local verification. State skipped checks and disabled campaign CI honestly.

Do not rewrite the body after every follow-up push. Record later CI fixes, newly discovered design issues, promoted deferred work, and Self-Review results as formal GitHub pull-request reviews with the `COMMENT` event so the thread preserves chronology. Use inline review comments when an observation belongs to a changed line and the review body for commit-wide or round-wide results. Do not use ordinary issue-style pull-request comments for this ledger, and never `APPROVE` or `REQUEST_CHANGES` on your own pull request. The title describes the merged outcome in Conventional Commits style, not the work process.

Push only the topic branch with upstream tracking. Use a file-backed body for multiline Markdown when opening through `gh`.

An ordinary pull request carries one GitHub issue unless two issues are genuinely the same defect. Issue campaigns override that boundary: a solo cycle pull request owns every implementation-ready issue in the cycle, and a multi-agent batch owns its admitted set. Record verification and any known gap in the body.

## Version Bumps Are Release Commits

`bumpp -r` through `pnpm release` owns version numbers across the workspace, so do not hand-edit a `version` field in an ordinary pull request. The development skill's [Change Integrity](../development/SKILL.md#change-integrity) rules state when a native change earns a new version and who assigns it.

## Issue Campaign Override

Before any issue-campaign push or pull request, complete the applicable steps of `.agents/skills/issue-campaign/development.md`; its final formatting step remains a merge gate. A solo campaign uses one cycle pull request and the ordinary check loop, plus its integration-sensitive gate. Only `.agents/skills/multi-agent/issue-campaign.md` overrides that flow with worktree batches, exact-SHA campaign-run cancellation, local implementation gates, and Post-Campaign Cleanup.

## Watch Checks After Every Ordinary Push

After each ordinary push, including every Post-Campaign Cleanup push, monitor the pull-request checks until every check settles. Only CI-suspended campaign implementation waves skip this loop. On failure, fetch the relevant job log, diagnose the real cause, fix it in place, push a new commit, and resume monitoring. Do not treat a green unrelated job as acceptance for a failed required surface.

The single `test.yml` job checks Evidence, Go, unit and E2E populations after shared preparation. Check every test step; a successful unit step does not establish SDK generation, installed-consumer behavior or declaration acknowledgments. Do not split tests into a workflow matrix or separate test workflows. Record the actual job duration against the eight-minute target.

## Merge On Explicit Request Or Standing Autonomous Mandate

Do not merge, squash-merge, rebase, or update the target branch on unprompted initiative. Merge when the user explicitly asks, or when a standing autonomous mandate authorizes end-to-end delivery; use the repository's established merge method unless another is specified. Under an autonomous mandate the author that owns the pull request merges it themselves once the merge gate below passes, without separate approval.

Before merging, apply the development skill's [final formatting rule](../development/SKILL.md#work-rules) and include any resulting changes in the pull-request head. Confirm required checks pass on that final head for an ordinary or Post-Campaign Cleanup pull request. For a multi-agent campaign implementation pull request whose automatic CI is deliberately suspended, confirm its local-verification, independent-verification, and integration gates instead. If branch protection blocks the requested merge, report the blocker rather than bypassing it.
