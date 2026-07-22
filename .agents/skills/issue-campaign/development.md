# Solo Campaign Development

Read this document in full when the user authorizes implementation pull requests or the end of a solo issue campaign that entered implementation. Also read the repository development, pull-request, and review skills before acting.

## Flow

- [Plan One Cycle Pull Request](#plan-one-cycle-pull-request)
- [Claim The Complete Cycle](#claim-the-complete-cycle)
- [Implement And Write Tests](#implement-and-write-tests)
- [Keep Working While Commands Run](#keep-working-while-commands-run)
- [Validate With CI And Self-Review](#validate-with-ci-and-self-review)
- [Merge And Clean Up](#merge-and-clean-up)
- [Repeat Until A Clean Round](#repeat-until-a-clean-round)

Five rules govern the implementation phase:

- The main agent performs all implementation, test authoring, CI diagnosis, review, and cleanup. Spawn no subagent except the read-only [commit early-warning pass](#implement-and-write-tests).
- Put every accepted, implementation-ready issue in the current cycle into one pull request. The issue DAG controls implementation order inside that pull request, not pull-request count.
- Work in the current checkout and one topic branch. Do not create a clone or worktree for a solo campaign or its Self-Review; a disposable checkout for a mutation experiment is a verification tool, not a second implementation home.
- The pull request's ordinary CI, a clean solo Self-Review, and every applicable integration gate are the acceptance gates. Repair every red CI lane in that same pull request, even when the failure predates the campaign or is unrelated to its original issues.
- Campaign branches and pull requests freeze package versions, release tags, and publication state. They never choose a release number or publish a package. A maintainer release begins only after campaign completion, or after the user explicitly suspends the campaign and lifts the freeze, and remains a separate task.

## Plan One Cycle Pull Request

Recompute the published-issue dependency DAG after publication. Record dependencies because they determine safe edit order and when one fix can expose another, but do not partition ready issues into separate pull requests.

Build the cycle scope in this order:

1. Reopen every published, unclaimed issue and verify it still belongs to this repository and campaign.
2. Remove only issues proved duplicate, invalid, out of scope, or externally blocked, and record the exact disposition. An accepted unresolved issue prevents campaign completion.
3. Check open pull requests and remote branches for overlapping work before claiming.
4. Put every remaining issue into one cycle ledger with its acceptance matrix, consequence surface, affected files, and DAG predecessors.
5. Record the issue count before grouping and the result as one pull-request unit.

Different packages, invariants, or validation lanes do not split the solo cycle. A native Go transform fix, a decorator change, a generated SDK baseline, and a website guide update belong in the same cycle pull request when they are all accepted campaign work. Keep issue-level commits when that improves diagnosis, but the pull request remains the integrated campaign unit.

An issue whose only predecessor is another issue in the same cycle is implementation-ready for this purpose. Order the edits through the DAG instead of deferring it to another pull request.

Difficulty never removes an issue from the cycle. When a resolution needs a judgment call about design, invariant ownership, or an acceptable behavior change, settle it from the issue's evidence and implement that decision inside the cycle. A proved duplicate, an invalid premise, an out-of-scope finding, and an external blocker remain the only dispositions that remove one.

## Claim The Complete Cycle

Claim the whole cycle before implementation:

1. Use the current checkout, update `master` with `git pull --ff-only`, and create one topic branch. Do not create a clone or worktree.
2. Create one implementation-free commit with `git commit --allow-empty`.
3. Push the branch and open one draft pull request.
4. Reference every cycle issue by number, mark verification pending, and state that the pull request owns the complete accepted cycle.
5. Record the checkout, branch, pull request, head SHA, issue set, and external temporary-asset ledger in `.wiki`.

Keep every closing keyword out of the claim body. The body is written before any code exists, so a claim-time closing list closes whatever the cycle later drops, defers, or disproves, burying the analysis those issues carry. The cycle's closing set is the union of the [commit closing lines](#implement-and-write-tests), which makes the merge close exactly what landed.

The empty pull request prevents overlapping contributor work before code is written. Measure official duration from its GitHub `createdAt` timestamp through `mergedAt`, including implementation, CI, review, fixes, rebases, and merge. Use the GitHub timestamps, not commit dates or a local stopwatch, and record the issue count beside the duration. A claim that never merges has no official duration; record it separately as cancelled or unresolved instead of substituting `closedAt`.

## Implement And Write Tests

Work through the DAG on the claimed topic branch. Analyze the full consequence and case surface across every issue before editing, then implement the complete cycle and its tests.

Before editing, turn each issue invariant into an executed consequence matrix over the parent skill's [discovery dimensions](SKILL.md#discover-issues), narrowed to what the owning code reaches: every caller, decorator and option combination, HTTP adapter, equivalent spelling and declaration provenance, transform-option interaction, boundary and malformed case, generated artifact, packed consumer, and supported platform. The issue's examples are seeds, not the matrix boundary. Record the matrix and every non-applicable cell with evidence in the campaign knowledge base and pull request.

Implement without interruption. Write each piece's tests as that piece lands instead of leaving the tests for the end of the cycle, and commit and push each unit as it becomes coherent instead of holding a finished snapshot while its checks run. Move straight to the next issue in the DAG; do not pause the sequence for a check run, because [CI is read once per settled head](#validate-with-ci-and-self-review).

Close each issue from the commit that earns it. End the commit message with one `Close #n: <issue title>` line per resolved issue, so a commit that resolves several issues carries several lines. GitHub matches the keyword and the number and ignores the title tail, so the line closes the issue normally while the log stays legible without opening each number.

A revert inside the pull request must not carry the closing keyword forward: `git revert` quotes the original subject, so rewrite its default `Revert "Close #n: ..."` without the closing phrase, and drop any `Closes #n` line for that issue from the pull-request body. That does not spare the issue by itself. A squash merge concatenates every commit message into the merge commit body, where the reverted commit's own `Close #n` line still sits, so the merge closes an issue whose fix no longer exists at `HEAD` and [the merge gate](#merge-and-clean-up) has to reopen it.

After each pushed commit, submit a formal GitHub pull-request review with the `COMMENT` event naming the commit, what it landed, and which issues it resolved. The review is the running ledger for a reader who does not read the diff, not a closing mechanism: GitHub closes an issue only from a commit message or the pull-request body. Follow the [pull-request skill](../pull-request/SKILL.md#write-the-pull-request) for inline comments, review bodies, and self-review restrictions; do not replace this ledger with ordinary issue-style pull-request comments.

Once a commit lands, the main agent may spawn one read-only subagent as a commit early-warning pass over that commit and keep implementing while it runs. The pass reads that one commit and reports candidates. It never edits, commits, pushes, or makes an implementation decision. Its value is timing: a defect named while that code is the newest thing written costs little to correct, and nothing has been built on top of it yet.

The pass never reduces the [Self-Review](#validate-with-ci-and-self-review) that gates the merge. A reader holding one commit cannot see what appears only across files: a helper that duplicates one the package already has, a native transform branch whose emitted decorator arguments no test workspace exercises, or a guide claiming a behavior the generator no longer performs. The main agent's own complete round over the whole base-to-head diff is what finds those, and no number of passes substitutes for it. The [review skill](../review/SKILL.md#commit-early-warning-pass) owns that boundary and the name the pass must not take.

Each issue remains an evidence and acceptance unit inside the combined diff. Keep its positive, negative, boundary, and regression cases identifiable. Near-100% coverage of changed behavior is required; a green happy path is not completion.

Promote every reproduced defect class, consequence-matrix boundary, and mutation that caught an implementation error into a permanent regression that a canonical package or root command discovers and executes. A dormant or one-off scratch witness is not enough when the same class could recur after the campaign.

Follow the development skill for test shape and narrow-then-broad local evidence. Do not treat a local build or test result as a substitute for the pull request's ordinary CI acceptance gate. After the source, tests, documentation, fixtures, and generated consequences are ready, run `pnpm format` and include its integrated result in the same pull request.

If implementation disproves, narrows, or externally blocks an issue, reopen the evidence and revalidate that conclusion from primary sources before changing the claimed scope. Record the evidence on the issue and pull-request thread, update the campaign ledger, and close a confirmed-invalid issue. Do not leave an orphan issue or pretend an unresolved accepted issue was completed.

## Keep Working While Commands Run

Start every long command asynchronously and continue with work that does not depend on its result. `pnpm install`, package builds, Go plugin compilation, and test suites are all background work. Watching a CLI process, repeatedly polling it without a decision to make, or idling until a run finishes is not campaign work.

Maintain a compact command record containing the command, source snapshot, start time, dependent decision, and final result. Check a running command at a genuine decision boundary, when it exits, or before merge. Do not use sleep loops or foreground waits merely to discover that a command is still running.

Overlap stops where it would destroy evidence. A Self-Review round runs against one frozen snapshot, and a merge waits for every result its gates depend on; both boundaries are stated below.

## Validate With CI And Self-Review

Commit and push the formatted integrated snapshot, then let every ordinary pull-request check run. Start solo Self-Review immediately over that exact base-to-head diff while CI executes. A test process may run during the round because it does not change the snapshot; a source edit does, so commit any correction and restart the round over the new head.

Submit every Self-Review finding round and the final clean round as a formal GitHub pull-request review with the `COMMENT` event. Attach line-specific findings as inline review comments and summarize round-wide findings or the clean conclusion in the review body; do not post ordinary issue-style pull-request comments for Self-Review.

Read CI once per settled head. It gates the cycle, not each commit. Only `test.yml` sets `cancel-in-progress`, so an intermediate commit's other lanes run to completion against a snapshot the cycle has already moved past; waiting on that result stalls implementation and proves nothing about the head that will merge. Note also that `.github/workflows/` is not the whole check surface: CodeQL default setup and the Socket Security app report on pull requests without a workflow file in this repository.

CI and review are independent gates:

- CI must prove every configured build, type-check, test, packaging, and platform lane.
- Self-Review must prove requirement fidelity, consequence coverage, issue-by-issue acceptance, test quality, documentation, generated output, and risks not encoded in CI.

Treat the native Go transform, the SDK and Swagger generators, shared metadata, common runtime helpers, package manifests or declarations, CLI code, and test or oracle infrastructure as integration-sensitive. Before merging such a change, construct the prospective merge result of `origin/master` and the pull-request head in a disposable checkout, and run the canonical command set for root build, test, static analysis, generated artifacts, and clean packed consumers. Record the exact SHAs and commands with the result. An unavailable or failed mandatory gate blocks merge. Re-read `origin/master` before merge and restart the gate if it changed, then verify the merge SHA with the same commands afterward. Do not turn master red.

Prove the regression tests are sensitive before merge: in a disposable checkout, revert or mutate only the product fix while retaining the tests, and require the expected assertions to fail while adjacent controls still pass.

When any gate finds a defect:

1. Diagnose the real cause from the CI log, review evidence, or gate output.
2. Correct the source and complete the corresponding regression coverage.
3. Run `pnpm format`.
4. Commit and push the correction to the same pull request.
5. Let the new CI run to completion and restart Self-Review as a fresh complete round over the new head.

Fix every red CI lane in the same pull request even when the failure predates the campaign or is unrelated to the campaign's original issues. Do not dismiss it as another contributor's failure.

The development skill records that a `test-sdk` e2e feature retries before the attempt whose output you see. In a campaign, treat an intermittent lane as a finding to adjudicate, not as noise to re-run away.

Do not merge a head whose green checks belong to an older SHA or whose clean review predates a correction. Continue the loop until the same immutable head has green required checks, a complete Self-Review round with no sound improvement, and every applicable integration and mutation record final.

## Merge And Clean Up

Merge only with user authorization, including a campaign-local standing authorization that explicitly covers merge.

Before merging, reconcile the closing keywords against what survives at `HEAD`. `git log origin/master..HEAD` shows every message the squash will concatenate, including commits a later one reverted, so read the whole range and confirm each issue the merge will close has a surviving fix.

After merge:

1. Verify GitHub records the pull request as merged into the intended target and every linked issue has the correct final state. Reopen any issue the squash merge closed without a surviving fix, and comment that the merge closed it mechanically.
2. Confirm the checkout has no unpushed or uncommitted work worth preserving.
3. Switch back to `master`, pull with `git pull --ff-only`, and delete the local topic branch.
4. Preserve the command evidence in the campaign knowledge base, then remove every disposable mutable root the cycle created: disposable mutation checkouts, `GOCACHE`, `GOTMPDIR`, `TTSC_CACHE_DIR`, generated-output roots, tarballs under `deploy/tarballs/`, the regenerated trees under `tests/test-sdk` and `tests/test-migrate/.generated`, and clean-consumer install roots. Confirm no live process uses a path before deleting it, delete only the exact proven path, and verify it is absent.
5. Never bulk-delete a shared temporary directory, a shared ttsc cache directory, an installed toolchain, or an asset whose ownership is uncertain.

Formatting belongs to the unified cycle pull request, so a separate post-campaign formatting pull request is not part of this solo workflow.

## Repeat Until A Clean Round

After every merged cycle, return to the parent skill's Discover Issues phase and perform another complete fresh round over the entire declared scope against one frozen integrated commit. Earlier rounds are not coverage, and a surviving issue or recent implementation never permits a residual-only review.

If any meaningful candidate survives fact-checking, adjudicate and publish it when authorized, then claim the next single cycle pull request containing every implementation-ready issue. Repeat discovery, implementation, CI, review, merge, and cleanup without a fixed round limit. If the user authorized discovery but not implementation, report the campaign as active and wait for implementation authority; the absence of authority is never completion.

The campaign succeeds only when all of these are true:

- one complete fresh full-scope discovery round finishes its whole census and matrix and produces no meaningful candidate after fact-checking;
- no accepted or published campaign issue remains unresolved or deferred;
- no campaign pull request, branch, process, or assignment-owned temporary asset remains; and
- the target checkout is clean and synchronized.

If an external blocker makes those conditions impossible, report the campaign as blocked rather than complete.
