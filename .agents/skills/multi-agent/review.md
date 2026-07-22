# Multi-Agent Review

Read this document only through the multi-agent skill for an explicitly requested team, parallel, or multi-agent review. The base review skill's Non-Negotiable Review Law still governs every reviewer: one agent performs one complete review of the entire declared surface from scratch, under all six rules.

Do not use this procedure for Self-Review. The author always completes Self-Review alone even when a separate team review is also authorized.

## Bound The Team

Form the largest practical team that adds meaningful independent evidence, up to nine review agents so the lead and reviewers fit the ten-agent session limit. Open a reviewer slot only when it owns one complete independent pass and can run immediately, and record the objective runtime or resource reason for every unused slot.

Give every reviewer the same complete surface. Different analytical lenses are welcome; package, file, concern, platform, or test-lane partitions are forbidden.

## Share One Immutable State

Every reviewer in a team or issue-discovery round uses the same immutable recorded snapshot, dependency lock, provisioned workspace contract, supported environment contract, and mandatory test matrix.

Issue discovery and committed pull-request review use an exact commit. A team reviewing uncommitted work uses one base commit plus a complete diff, untracked-file manifest, and content hash copied into isolated worktrees. If a shared target changes before every report finishes, the round is invalid; restart every reviewer on one new snapshot instead of combining results from different states.

## Brief Every Agent

Review agents may start without conversation history or loaded repository instructions. Give each a self-contained brief containing:

- the objective and complete declared surface;
- constraints and evidence locations;
- the required output format; and
- the exact repository instructions and skills to read.

State facts and constraints, not a preferred conclusion. Agents execute the brief directly and do not re-delegate.

For issue discovery, include the frozen commit, reproducible provisioning command, full repository scope, mandatory coverage matrix, supported environment contract, required evidence schema, and explicit instruction to finish the entire review after finding a candidate. A brief that assigns a subsystem or lens invalidates that agent as a complete-round reviewer.

## Team Review Cycle

1. Freeze the exact surface and record its base and head.
2. Give each reviewer its self-contained brief.
3. Require every reviewer to inspect the full surface independently and report evidence-backed findings directly to the lead. Reviewers do not negotiate a consensus or use discussion transcripts.
4. The lead independently reproduces and validates every proposal against the repository and relevant provenance. Accept, rewrite, combine, partially accept, or reject it according to evidence.
5. Apply every accepted in-scope improvement, complete the authorized verification, and freeze a new exact surface.
6. If anything changed, replace the team and begin another complete cycle. Stop only when one whole team cycle yields no accepted improvement.

## Research Review Round

Use a Research Review Round when the review needs external primary sources or sibling-repository provenance, such as the upstream `typia` and `ttsc` checkouts the native transform composes, the NestJS request lifecycle on either HTTP adapter, or the authoritative OpenAPI specification the Swagger generator must satisfy.

Each reviewer still inspects the complete change surface and all relevant primary sources independently. Agents submit evidence-backed proposals directly to the lead without a discussion phase. External research adds evidence; it does not relax full-surface coverage or the fresh-cycle stop rule.

## Parallel Issue Discovery Rounds

Use this mode only through the multi-agent issue-campaign procedure.

1. Freeze one exact commit, version one canonical coverage matrix, and fully provision one reproducible workspace contract before briefing. Give every reviewer an isolated clean worktree and isolated mutable build, generated-output, and consumer directories; immutable download and compiler caches may be shared. Give every agent the same entire campaign scope and require the issue-campaign, project, development, and review skills in its brief. Never assign A/B/C/D lanes, preferred packages, exclusive lenses, or exclusions owned by another reviewer.
2. Every agent independently runs the [Solo Issue Discovery Round](../review/SKILL.md#solo-issue-discovery-rounds) steps over the whole scope: inventory the tracked surface, reconcile it with that matrix, audit the entire inventory, execute the whole matrix, and continue after finding candidates. A grep lens, sampled file set, assigned subsystem, or statement that the surface was reviewed is not coverage.
3. When any reviewer discovers a new owner, consumer, axis, or interaction, the lead adds it to the canonical matrix without sharing candidate conclusions, and every reviewer, including one that already reported, executes the added cells before the round can complete.
4. Each agent submits its own full-surface report without discussion or a shared candidate list, identifying the exact commit and environment, matrix version, tracked-file census, matrix results, commands and artifacts, candidates, killed hypotheses, and every gap. A round that skipped a required file or cell is incomplete, whatever it found. A complete report may contain candidates, which the lead adjudicates rather than asking the reviewer to suppress.
5. The lead reopens the evidence in a fresh isolated worktree, reproduces every candidate against an independent oracle, checks ownership, provenance, complete consequence surface, and any claimed **Forbidden** classification, and compares existing issues and pull requests. A defect that actually belongs to `typia`, `ttsc`, or NestJS is reported upstream, not filed here. Reject, rewrite, combine, partially accept, or return a proposal as the evidence requires, and keep implementation mechanisms as hypotheses.
6. An independent critic audits every lead disposition in another fresh worktree, including rejection, narrowing, combination, deferral, and invalidation; for an accepted candidate the critic also repeats the current failure and oracle and checks the invariant, consequence census, boundaries, and regression matrix. Any lead-critic disagreement leaves the candidate surviving.
7. Record every lead and critic disposition in the campaign knowledge base. Whenever the round produced a candidate, replace the team and run another complete repository-wide round against the same commit; the phase ends only on a round that adds nothing the earlier rounds had already recorded. When the user authorized end-to-end implementation, implement every accepted issue after that empty round, freeze the new integrated commit, and run the same loop again. Otherwise stop at the authorized phase without mutation and report the campaign as active. A prior finding is not permission to narrow the next round to its owner or neighbors.
8. End discovery only when every agent in one immutable-state round finishes the entire repository inventory and matrix and lead plus critic verification leaves no meaningful candidate, as the [solo stop rule](../review/SKILL.md#solo-issue-discovery-rounds) defines meaningful. One lane's clean result, one agent's clean result, or green existing suites cannot satisfy the stop rule.
