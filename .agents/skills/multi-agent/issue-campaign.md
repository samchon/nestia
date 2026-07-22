# Multi-Agent Issue Campaign

Read this document only through the multi-agent skill for an explicitly parallel issue campaign. Read the base issue-campaign, project, development, pull-request, review, and [multi-agent review](review.md) procedures before acting.

The base issue-campaign skill owns authorization, the knowledge base, candidate adjudication, self-contained issue bodies, and the clean full-scope completion gate. This document overrides only discovery and implementation topology.

## Flow

- [Select The Parallel Boundary](#select-the-parallel-boundary)
- [Parallel Discovery](#parallel-discovery)
- [Cancel Campaign CI](#cancel-campaign-ci)
- [Plan And Claim A Pull Request Wave](#plan-and-claim-a-pull-request-wave)
- [Implement And Revalidate A Batch](#implement-and-revalidate-a-batch)
- [Remove Every Finished Worktree](#remove-every-finished-worktree)
- [While Campaign CI Is Cancelled](#while-campaign-ci-is-cancelled)
- [Repeat A Campaign Cycle](#repeat-a-campaign-cycle)
- [Post-Campaign Cleanup](#post-campaign-cleanup)

Four rules govern the parallel implementation phase, which is the wave of concurrent batch pull requests. A campaign whose implementation returns to the solo procedure has no such phase, so its cycle pull request follows the solo rules and ordinary CI instead:

- Local and package verification, solo Self-Review, independent verification, lead readback, and every applicable integration gate are mandatory implementation gates.
- Do not run `pnpm format` during discovery, issue publication, or parallel batch implementation. Post-Campaign Cleanup owns the repository-wide formatter result. A campaign that returns implementation to the solo procedure formats its cycle pull request there instead, and then needs no cleanup format pull request.
- Never disable repository Actions or any workflow for a campaign. After every campaign push and pull-request creation, immediately start an exact-SHA cancellation record for only the runs that campaign commit caused, except when the user designated that exact integration SHA before its push. Keep the record current and complete it before merge, but never make local development wait for it.
- Campaign branches and pull requests freeze package versions, release tags, and publication state, exactly as the [solo rule](../issue-campaign/development.md#flow) states.

Start long commands asynchronously and keep working under the solo procedure's [Keep Working While Commands Run](../issue-campaign/development.md#keep-working-while-commands-run). Never reserve an agent to watch an install, build, test, or cancellation, and never let a live cancellation record stop local reading, editing, committing, or Self-Review; it gates remote progression and merge, not thought.

## Select The Parallel Boundary

A multi-agent issue campaign parallelizes both discovery and implementation by default.

Switch to parallel discovery with solo implementation only when the user explicitly requests that combination. In that mode:

1. Run Parallel Discovery and let the lead complete candidate adjudication and authorized publication.
2. Stop every discovery agent before implementation begins.
3. Read the base issue campaign's [solo development procedure](../issue-campaign/development.md).
4. Put every implementation-ready issue into its one empty-claim pull request, use the current checkout without a worktree, run `pnpm format`, validate through ordinary CI, and complete solo Self-Review while CI runs.
5. Apply that procedure's implementation, CI, merge, branch cleanup, and temporary-asset rules, but return here for the next parallel discovery round instead of switching to solo discovery.

Do not infer solo implementation from quota concerns, a small issue count, or the fact that the lead performs publication. Only the user's explicit phase boundary selects it.

## Parallel Discovery

Use [review.md](review.md)'s Parallel Issue Discovery Rounds. Every discovery agent audits the whole declared scope independently against one frozen commit, one provisioning contract, and the parent skill's coverage matrix. The lead alone fact-checks and publishes, and an independent critic audits every disposition.

Source is only one evidence layer for nestia. Run the generators and read what they emit: the Swagger document, SDK library, mockup simulator, and generated e2e suite are product output, and a defect visible only in emitted code is still a defect.

Pool raw candidates in `.wiki`, then reproduce and combine, split, rewrite, reject, or defer them before publication. Parallel discovery changes evidence breadth, not publication authority.

Rounds repeat inside one discovery phase, exactly as the [solo rule](../issue-campaign/SKILL.md#discovery-ends-only-on-an-empty-round) states. A round in which any reviewer found a candidate is followed by another full-scope round against the same commit, and only an empty round releases the phase to publication.

## Cancel Campaign CI

A parallel campaign runs many concurrent branches, so its implementation waves rely on local verification, independent verification, and integration gates instead of ordinary pull-request checks. Repository-wide Actions and workflow settings must remain unchanged. Before the first push, record `gh api repos/{owner}/{repo}/actions/permissions` and `gh workflow list --all --limit 1000 --json id,name,path,state` in `.wiki/<campaign>/ci-state.md` so the lead can prove the campaign did not alter them.

Every push gets its own cancellation record. Start it immediately in a background supervisor rather than leaving an implementation agent to poll it:

1. Record the campaign branch and pushed commit SHA.
2. List runs for that exact SHA with `gh run list --commit <sha> --limit 100 --json databaseId,headBranch,headSha,status,conclusion,url`.
3. Cancel every `queued`, `in_progress`, `waiting`, `pending`, or `requested` run for that SHA with `gh run cancel <run-id>`. Never cancel by broad repository, workflow, or contributor filters. For an exact integration SHA the user designated before its push, do not cancel; record every run and poll it to a terminal result.
4. Poll again because push, pull-request, chained, and ruleset runs can appear after the first query. Continue until two consecutive polls find no new run and every observed run is terminal.
5. Record the run IDs and final states in `.wiki/<campaign>/ci-state.md`. If enumeration, cancellation, or readback fails, surface the failure and suspend later remote mutations and merge until it is repaired.

Enumerate by SHA rather than by an expected job list. Four workflow files trigger on `pull_request` here — `build`, `test`, `website`, and `spell-check` — and `test` alone fans out to eight matrix jobs and sets a cancel-in-progress concurrency group, which is an automatic supersede rather than a recorded cancellation. All but `spell-check` carry path filters, so the set that actually starts depends on the batch's touched paths, and `.github/workflows/` is not the whole surface: CodeQL default setup and the Socket Security app also report on pull requests without a workflow file, and `gh run cancel` does not apply to app-reported checks.

Opening or updating a pull request can enqueue additional runs for the already-pushed SHA, so start the same record after pull-request creation and after any operation that retriggers checks. The initial claim push and its immediately following claim pull request are one reservation transaction, so opening that pull request does not wait for the first poll. Before merge, read every campaign SHA record back and require every ordinary campaign run to end `cancelled`, with a run already terminal when first observed or a designated integration run recorded at its actual conclusion.

## Plan And Claim A Pull Request Wave

Recompute the published-issue dependency DAG after publication and before every implementation wave. A published issue is an evidence and acceptance unit, not a default pull-request boundary. Form the smallest number of maximal cohesive batches that the verified dependencies and implementation surfaces permit.

Group issues only when they are ready on the same DAG frontier, share an architectural owner or root invariant, overlap in consequence surface, use mostly the same verification, and remain understandable, reviewable, and reversible as one diff. Split for a named dependency, external blocker, repository or target-branch boundary, independent release contract, incompatible verification owner, destructive file overlap, or lost issue-level attribution.

Topic, label, package proximity, reporter, and issue count do not justify a batch or a split by themselves. File disjointness does not require a split when the same root cause and verification lane bind the files, and file overlap does not justify grouping issues with different readiness, ownership, or atomicity.

Apply merge pressure only after admission. Among partitions that every grouping test still supports, choose fewer pull-request units because each extra batch adds a claim, rebase, cancellation, integration, and merge gate. A split reason always wins; reducing pull-request count never overrides correctness, rollback, failure attribution, or a dependency.

Worktrees in this repository are not free, which sharpens that merge pressure: each needs its own `pnpm install`, and a batch that touches the native transform rebuilds the Go plugin into that worktree's cache. Set `TTSC_CACHE_DIR` to the shared root cache when the batch does not change Go source.

Record the DAG edges, the issues in each batch, the owned change and consequence surfaces, the shared verification lane, and every grouping and split reason in the campaign knowledge base. Report the pull-request unit count before and after batching, then check open pull requests and remote branches for overlapping implementation immediately before claiming.

Freeze a batch once its empty claim pull request exists. Do not close, move, split, or combine an active claim merely to improve throughput statistics; change it only when correctness, overlap, or invalidated evidence requires a lead decision. Run disjoint dependency-ready batches concurrently up to practical capacity, serialize batches that overlap or depend on one another, and assign one batch to one agent, worktree, branch, and pull request.

The agent assigned a batch claims it as its first action, before installing dependencies or writing implementation code:

1. Create one isolated worktree and topic branch.
2. Create one implementation-free claim commit with `git commit --allow-empty`.
3. Push the branch, start its exact-SHA cancellation record, and immediately open a draft pull request that overviews the batch scope and links every batched issue. This is an empty reservation pull request, not a request to wait for setup or validation.
4. Start the pull-request-triggered cancellation record, mark verification as pending, and record the batch, worktree, branch, issues, pull request, and cancellation records in the campaign knowledge base.
5. Start `pnpm install` asynchronously in the worktree, then begin the source, consequence-surface, and test-design work immediately.

Keep every closing keyword out of the claim body for the reason the [solo claim rule](../issue-campaign/development.md#claim-the-complete-cycle) states. The batch's closing set is the union of its commit closing lines.

Measure the official duration of a claimed batch from its empty claim pull request's GitHub `createdAt` timestamp through `mergedAt`, including installation, dependency waiting, implementation, validation, review, rebases, cancellation, and merge. Keep outliers, record the issue count beside the duration, and record a claim that never merges as cancelled or unresolved instead of substituting `closedAt`.

## Implement And Revalidate A Batch

Analyze the full consequence and case surface across every issue in the batch. Follow the repository development skill for implementation, tests, documentation, generated artifacts, and narrow-then-broad local verification, and build each issue's [consequence matrix](../issue-campaign/development.md#implement-and-write-tests) before editing.

Close each issue from the commit that earns it under the [solo closing and revert rules](../issue-campaign/development.md#implement-and-write-tests), and submit a formal `COMMENT` pull-request review naming what that commit landed. Commit and push every coherent increment as soon as its source and test program are complete instead of holding a finished snapshot while its tests run, then start that push's exact-SHA cancellation record and consume the results when they arrive.

An implementation agent may find that an issue is false or too broad. The lead and an independent critic must validate that conclusion in separate fresh worktrees before campaign state changes, and any disagreement keeps the original issue and batch state active:

- For a narrowed issue, record the evidence on the issue and pull-request thread, then update the batch scope.
- For a confirmed-invalid issue, record the evidence and close the issue.
- If no issue remains in the batch, close the claim pull request instead of leaving an orphan reservation.

Before merge, complete solo Self-Review over the frozen head, opening each round with a formal `COMMENT` review that states its findings and remediation plan before acting on them so the thread records why every follow-up change happened. A pending narrow test never delays the start of that review, but its final result is required before merge.

Then require an independent verifier who did not implement the batch to work from fresh base and head worktrees and:

1. Inspect the complete tree and diff, including file modes, links, ignored generated output, worktree status, and packed contents.
2. Reproduce the fail-before state and inspect the pass-after emitted or packed behavior.
3. Execute every applicable consequence-matrix cell, validate every non-applicable disposition, and confirm the negative twins and boundaries.
4. Prove the regression test is sensitive by reverting or mutating only the product fix while retaining the test in a disposable worktree; the expected assertion must fail while adjacent controls still pass.

Treat the native Go transform, the SDK and Swagger generators, shared metadata, common runtime helpers, package manifests or declarations, CLI code, and test or oracle infrastructure as integration-sensitive. Immediately before merge, construct the prospective merge result of `origin/master` and the pull-request head in a disposable worktree and run the canonical command set for root build, test, static analysis, generated artifacts, and clean packed consumers. Record the exact SHAs and commands with the result. The lead may add a gate but may not omit one on a narrower consequence claim, and an unavailable or failed mandatory gate blocks merge. Re-read `origin/master` before merge and restart the gate if it changed, then verify the merge SHA with the same commands before any later campaign pull request merges. Do not turn master red or stack another batch on a package-only-tested integration state.

The implementing agent may merge only after implementation, Self-Review, independent verification, package-scoped verification, the cancellation record, and every triggered integration gate are complete, and after the [merge gate](../issue-campaign/development.md#merge-and-clean-up) reconciles the batch's closing keywords against what survives at `HEAD`. Under an ordinary campaign it waits for explicit user authorization; under a standing autonomous mandate it merges as soon as those gates pass, without a per-pull-request request.

Promote every reproduced defect class, consequence-matrix boundary, and mutation that caught an implementation error into a permanent regression that a canonical package or root command discovers and executes. A dormant or one-off scratch witness is not enough when the same class could recur after the campaign.

## Remove Every Finished Worktree

Worktree removal is part of finishing an assignment, not optional housekeeping.

After a pull request merges:

1. Verify GitHub records it as merged into the intended target. This works for merge, squash, and rebase strategies.
2. Confirm the worktree has no unpushed or uncommitted work worth preserving.
3. Preserve the command evidence in the campaign knowledge base, then remove every disposable mutable root assigned to that worktree: `GOCACHE`, `GOTMPDIR`, `TTSC_CACHE_DIR`, generated-output root, tarballs under `deploy/tarballs/`, and clean-consumer install root. Logs and recorded results are the evidence, not a reason to retain compiled cache contents.
4. Run `git worktree remove --force <path>` so ignored build artifacts are deleted too.
5. Verify the worktree directory and every assigned Go temporary root no longer exist.
6. Run `git worktree prune` and delete the local topic branch.
7. Confirm `git worktree list --porcelain` contains no record of the removed path.

A campaign worktree accumulates `node_modules`, `lib/`, `bin/`, compiled Go plugin caches, and the regenerated trees under `tests/test-sdk` and `tests/test-migrate/.generated`. `--force` is what removes them; leaving the directory behind leaves gigabytes on disk.

If an assignment ends without a merge, first record retained evidence and confirm the remaining contents are disposable. Then remove its worktree, assigned Go temporary roots, and local branch by the same standard.

Apply this rule to every campaign-created worktree, including one used for Post-Campaign Cleanup and every verifier or mutation worktree. Do not mark an assignment complete while its worktree or assigned Go temporary assets remain on disk.

## While Campaign CI Is Cancelled

- Record local verification for each pull request. Do not dispatch replacement CI unless the user designated one exact integration SHA before its push.
- Keep repository Actions and workflow settings unchanged. Cancel only exact-SHA campaign runs after every push or pull-request retrigger, and let only a pre-designated exact integration SHA run to its actual conclusion.
- If work pauses, report local verification and the final state of every run for the latest campaign SHAs.

## Repeat A Campaign Cycle

Report the wave after every surviving issue is covered by its assigned batch pull request.

After every integrated implementation wave, return automatically to the parent skill's Discover Issues phase. Freeze one integrated commit, brief a new team on that same commit, the full repository scope, the provisioning contract, and the coverage matrix, and run another complete round. Earlier rounds are not coverage, and a surviving issue or recent implementation never permits lane assignment or a residual-only review: every reviewer starts again from the entire repository and continues after finding candidates until the full census is complete.

If the user authorized discovery but not implementation, report the campaign as active and wait for implementation authority; the absence of authority is never completion. Repository Actions remains unchanged, and discovery alone does not authorize issue publication, pull requests, or merging.

## Post-Campaign Cleanup

Run normal completion cleanup only after the terminal repository-wide round satisfies the review skill's stop rule, every campaign pull request is resolved, every campaign worktree is removed, and no campaign branch needs another push.

1. Return to `master` in the main checkout, confirm it contains no unrelated user changes, and pull the final campaign result with `git pull --ff-only origin master`.
2. Run `pnpm format` once against the integrated repository. It stops short of `tests/**/*.ts` for the reason recorded in `.agents/skills/project/SKILL.md`, so format a touched test workspace explicitly.
3. If formatting produces no diff, report that no cleanup pull request was needed and stop.
4. If formatting changes files, create a dedicated topic branch containing the formatter result and only directly necessary fixes.
5. Commit and push under the pull-request skill, pass the exact-SHA cancellation gate, open the Post-Campaign Cleanup pull request, and pass the gate again for pull-request-triggered runs.
6. Diagnose any locally reproducible failure, fix it, commit, push, and cancel the new commit's runs by the same gate.
7. Merge once required checks pass: with explicit user authorization, or on a standing autonomous mandate without a separate request.
8. Return the checkout to `master` and pull with `git pull --ff-only origin master`, deleting the local cleanup branch; remove an auxiliary cleanup worktree under Remove Every Finished Worktree instead.
9. Require the main checkout to be clean. Compare the final repository Actions permission and workflow inventory with the initial record and require that the campaign made no change.

If the user ends the campaign before that terminal clean round, record the campaign as cancelled or incomplete, apply Remove Every Finished Worktree to disposable campaign state, remove other safe campaign artifacts, then stop. That path performs no format commit, push, or merge, and is never presented as campaign completion.
