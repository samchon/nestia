---
name: review
description: Defines exhaustive solo review, Self-Review, and solo repository-wide issue-discovery rounds for nestia. Use for every self-review or unqualified review request and as the default review mode inside issue campaigns. This skill never spawns review agents; use the multi-agent skill only when the user explicitly requests a team, parallel, or multi-agent review.
---

# Review

## Non-Negotiable Review Law

One reviewer performs every review in this skill from scratch over the entire declared surface. Do not spawn a subagent, delegate a concern, or load the discussion skill. Do not create a clone or worktree for solo review or Self-Review.

Choose the principled conclusion. Review duration, difficulty, and consequence surface are reasons to inspect more deeply and verify more carefully, never reasons to overlook a sound improvement, accept an unsupported claim, or lower the completion standard.

A complete round must satisfy all six rules:

- **Whole surface:** read every changed file and hunk. For issue discovery, audit the entire campaign scope. Never partition by file, package, concern, platform, or pass, and never substitute another reviewer's coverage.
- **Consequence surface:** inspect affected code paths, tests, generated artifacts, CI, packaging, documentation, and consumers. Trace side effects, state transitions, concurrency, platforms, boundaries, compatibility, and failure and recovery paths beyond the named symptom or diff.
- **Fresh start:** use the current state and repeat the whole inspection. Earlier rounds, sampled files, and a recheck of only the latest fix do not count as coverage.
- **Unlimited rounds:** whenever the reviewer applies an improvement or accepts a meaningful issue candidate, update the work and start another complete round. Stop only after a complete round produces nothing that survives verification.
- **One immutable state:** a round runs against one recorded state, dependency lock, provisioned workspace contract, supported environment contract, and mandatory test matrix. Issue discovery and committed pull-request review use an exact commit. A solo review records its exact starting diff and refreshes that snapshot after every edit; a review round must not race a source change. The [multi-agent review procedure](../multi-agent/review.md) states how a team shares one snapshot.
- **Auditable completeness:** the reviewer accounts for every tracked file and every mandatory decorator, generator-output, consumer, boundary, transform-option, HTTP-adapter, packaging, and supported-platform matrix cell in the declared surface. Finding a candidate never ends or narrows the review. A skipped file, unprovisioned harness, unsupported claim, or unexecuted required cell makes the report `INCOMPLETE`, never `COMPLETE`.

## Self-Review

Self-Review and an unqualified review request use this solo workflow:

1. Establish the complete change surface, including the pull-request base-to-head diff and any uncommitted changes.
2. Perform one complete round under the Non-Negotiable Review Law. Include correctness and boundaries, Express and Fastify behavior, Windows and POSIX behavior, concurrency and state, data loss and security, cache and recovery invariants, public API and compatibility, generated SDK, Swagger, and e2e output, test isolation, CI and packaging, documentation, and migration effects.
3. Reproduce every suspected defect before accepting it.
4. Apply every sound improvement and run the narrowest verification authorized by the owning workflow.
5. If anything changed, restart at step 1 as a fresh full round.
6. Finish only when a complete round finds nothing to improve. Report the final clean round and every verification that could not run.

Self-Review does not authorize creating, pushing, updating, or merging a pull request. If the user separately requests one of those actions, follow the pull-request skill.

## Commit Early-Warning Pass

A commit early-warning pass is not a review under this skill. It is the read-only per-commit reader a solo campaign author runs on every pushed commit while still implementing, required and defined by the [solo campaign development document](../issue-campaign/development.md#implement-and-write-tests).

It delegates nothing the Non-Negotiable Review Law governs. The law governs the author's own round, which still runs alone over the whole surface before merge under all six rules. One commit is not a declared surface, a reported candidate is not an accepted finding, and the passes do not add up to a round.

Never call the pass a Self-Review, and never report it as one. A reader who sees that name concludes the gate already ran, and the whole-surface round disappears without anyone deciding to drop it.

## Solo Issue Discovery Rounds

Use these rounds only through the solo issue-campaign skill.

1. Freeze one exact commit and record the dependency lock, provisioning command, and supported environment contract, as the [issue-campaign skill](../issue-campaign/SKILL.md#discover-issues) defines them.
2. Inventory all tracked files, package and public API families, implementation owners, generated artifacts, test harnesses, workflows, documentation contracts, supported platforms, and open and closed issue or pull-request history before examining candidates. Reconcile that inventory with `git ls-files` and with the campaign's coverage matrix. A grep lens, a sampled file set, or a statement that the surface was reviewed is not coverage.
3. Audit the entire inventory yourself and execute the whole campaign matrix. Inspect source, tests, documentation, CI, packaging, generated artifacts, platform behavior, upstream and downstream provenance, and history against the development skill's [Forbidden](../development/SKILL.md#forbidden) section. Continue through the full inventory after finding a candidate.
4. Record every raw candidate, killed hypothesis, command, and artifact in the campaign knowledge base against the exact commit and environment. Do not silently discard a suspicion because it looks duplicative or inconvenient.
5. Reopen each candidate from primary evidence in a fresh state, reproduce it, verify ownership and provenance, trace its complete consequence surface, and compare existing issues and pull requests. A defect that actually belongs to `typia`, `ttsc`, or NestJS is reported upstream, not filed here.
6. Record accept, partial acceptance, rewrite, combine, split, reject, or defer with the supporting evidence, so a later round does not rediscover a rejected premise as new. Implementation mechanisms remain hypotheses.
7. Start another complete full-scope round against the same state whenever the round produced a candidate, and keep repeating until one round adds nothing the earlier rounds of this phase had not already recorded. Only that round ends the discovery phase and releases its adjudicated candidates for publication when the campaign is authorized to publish. After the authorized implementation flow merges, freeze the new integrated commit and run the same loop again. A prior finding never permits narrowing the next round to its owner or neighbors.
8. End discovery only when one complete fresh round over the entire scope finishes its census and matrix and produces no meaningful candidate after fact-checking. Any verified in-repository correctness, contract, data-integrity, build, test-oracle, documentation, packaging, workflow, or **Forbidden** violation is meaningful regardless of severity, rarity, legacy status, or malformed-input trigger. An unresolved or deferred verified defect blocks the campaign, and green existing suites cannot satisfy the stop rule.

## Explicit Multi-Agent Reviews

When the user explicitly asks for a team, parallel, or multi-agent review, load the [multi-agent skill](../multi-agent/SKILL.md) and its [review procedure](../multi-agent/review.md) instead of this workflow. It inherits the same whole-surface, immutable-state, and auditable-completeness law while defining independent parallel reviewers, agent briefing, and lead and critic adjudication. A Research Review Round that needs external primary sources or sibling-repository provenance, such as the upstream `typia` and `ttsc` checkouts or the authoritative OpenAPI specification, lives there too.
