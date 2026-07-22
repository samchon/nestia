---
name: issue-campaign
description: "Defines the default solo repository-wide issue campaign for nestia: exhaustive discovery, lead-vetted issue publication, one unified CI-validated implementation pull request per cycle, solo Self-Review, and repeated rediscovery until a full clean round. Use for broad audits, many issue candidates, or repeated issue-to-pull-request campaigns unless the user explicitly requests parallel or multi-agent execution; do not use for one already-defined issue or an ordinary pull request."
---

# Issue Campaign

An issue campaign is a repeatable solo sequence of exhaustive discovery, issue publication, one unified implementation pull request, and renewed discovery. The main agent owns every phase and spawns no subagent other than the read-only commit early-warning pass that [development.md](development.md#implement-and-write-tests) defines.

Use the [multi-agent skill](../multi-agent/SKILL.md) and its issue-campaign procedure instead only when the user explicitly asks for a parallel or multi-agent issue campaign.

The user's requested phase boundary controls how far to proceed. Do not infer permission to publish issues, push branches, open pull requests, or merge from an audit-only request.

Apply [AGENTS.md's **Choose the principled course** rule](../../../AGENTS.md#attitude) to every admission, disposition, implementation, and review decision.

Read the project, development, and review skills before starting. Use the review skill's [Solo Issue Discovery Rounds](../review/SKILL.md#solo-issue-discovery-rounds). Read [development.md](development.md) in full only when implementation is authorized.

## Campaign Knowledge Base

Create `.wiki/<campaign>/` with a short filesystem-safe campaign name. Preserve and reconcile an existing campaign directory.

Keep concise, current Markdown documents for:

- repository provenance, architecture, validation ownership, and product boundaries;
- experiments, reproductions, dogfooding, and related issue or pull-request history;
- every raw candidate, its evidence, dependencies, and final disposition;
- candidate combinations, splits, rejections, deferrals, and the evidence supporting each decision;
- each round's frozen commit, dependency lock, provisioning command, supported environment contract, and audited-surface and matrix results; and
- the published-issue DAG, internal implementation order, the unified cycle pull request, CI and Self-Review iterations, external blockers, official GitHub `createdAt`-to-`mergedAt` cycle timing, and cleanup state.

Record raw candidates before fact-checking. The knowledge base is the durable place to collect overlapping observations, then combine, split, rewrite, reject, or defer them without losing why.

Record every audited path and executed cell against its evidence, and record an absent check as absent rather than omitting it. A round whose notes cannot distinguish an executed check from an unrun one cannot support [Discovery Ends Only On An Empty Round](#discovery-ends-only-on-an-empty-round).

The knowledge base supports the campaign but is not the final issue body. A published issue must stand alone without access to `.wiki`.

## Discover Issues

Freeze one exact commit before every round and work from it with a recorded dependency lock and provisioning command. Derive the supported environment contract from package engines, public documentation, repository CI, peer requirements, and published package behavior rather than narrowing it ad hoc. Never combine results from different commits, and never accept a stale, unprovisioned, skipped, or sampled harness as full-round evidence.

Perform one complete Solo Issue Discovery Round over every tracked repository surface. Source is only one evidence layer. Exercise real workflows and inspect relevant upstream behavior, history, generated artifacts, consumers, fixtures, public documentation, and closed decisions. For nestia that means running the generators and reading what they emit: Swagger documents, SDK libraries, mockup simulators, and generated e2e suites are product output, and a defect visible only in emitted code is still a defect.

Cover this matrix as a floor and add the dimensions source and history reveal: every decorator and its option set; Express and Fastify for every request and response path; the Swagger document, SDK library, mockup simulator, and generated e2e suite one controller produces; `INestiaConfig` options and CLI flags, including the `--project` and `--config` paths; equivalent aliases, interfaces, classes, intersections, unions, generics, and re-exported or ambient declarations; user-global, default-library, module, package, and runtime-native provenance; transform-option interactions; valid, invalid, malformed, maximum-width, and one-past-boundary inputs; repeated generated-byte identity; clean tarball consumers; and supported Node, module-resolution, operating-system, and CLI paths.

Every interaction that reaches shared control flow is a separate cell, and every positive cell has a one-axis negative twin. Record negative results and killed hypotheses so a later round knows which exact experiment already ran.

Treat the development skill's [Forbidden](../development/SKILL.md#forbidden) section as a retrospective audit contract, not only a rule for future changes. In every complete round, inspect the implementation and history for a verified violation, even when existing tests pass. Prove the classification from purpose, control flow, consequence, and history. Resemblance or stylistic preference is not evidence.

Do not stop after finding enough work for a pull request. Complete the entire scope, adjudicate the full candidate pool, and publish only the surviving issues when authorized.

A verified in-repository correctness, contract, data-integrity, build, test-oracle, documentation, packaging, workflow, or **Forbidden** violation is meaningful regardless of severity, rarity, legacy status, or malformed-input trigger. Do not downgrade a proved defect to an observation to satisfy the stop rule, and do not let a deferral hide it: an unresolved verified defect blocks campaign completion.

### Every Round Is Full-Scope

Every round re-audits the entire declared scope against the current integrated state. A round is never partitioned: not by package, file, concern, platform, or validation lane, not by the areas the last cycle happened to touch, and not by splitting the scope across rounds so that each one covers a slice. A merged cycle changes the state every earlier conclusion rested on, so what an earlier round read is not coverage for this one. The [review skill's Non-Negotiable Review Law](../review/SKILL.md#non-negotiable-review-law) states the same rule for every round and review the campaign runs.

Only an explicit user instruction or an existing public product contract can exclude a surface or environment from the scope. The campaign cannot narrow itself, and an unresolved support-policy question leaves the round incomplete.

### Discovery Ends Only On An Empty Round

A merged cycle does not end the campaign. It produces one more round: begin a fresh full-scope round against the integrated repository. Discovery continues cycle after cycle, with no round limit, and ends only when one complete fresh round produces no meaningful issue candidate after fact-checking and no accepted issue remains unresolved.

Report the campaign complete only from a round that actually came up empty and that finished its whole census and matrix. Ending after a cycle that merely felt thorough leaves the issues the next round would have found unrecorded.

## Vet And Publish Issues

The same main agent owns every publication decision. For each candidate:

1. Reopen its evidence in a fresh state and reproduce the behavior against an independent oracle.
2. Verify ownership, provenance, and any claimed classification under the development skill's **Forbidden** section. A defect that actually belongs to `typia`, `ttsc`, or NestJS is reported upstream, not filed here.
3. Trace the full consequence surface.
4. Compare open and closed issues and pull requests.
5. Record accept, partial acceptance, rewrite, combine, split, reject, or defer with the supporting evidence.

Revalidate every disposition from primary evidence, including rejection, narrowing, combination, split, deferral, and confirmed-invalid conclusions, rather than trusting the note that first recorded it. A disposition that cannot be reproduced leaves the candidate surviving; omitting its publication does not settle it. The [multi-agent procedure](../multi-agent/issue-campaign.md) assigns this audit to an independent critic agent, and a solo campaign performs it as a separate pass with its own recorded evidence.

Publish only the adjudicated form and only with user authorization.

### Self-Contained Issue Body

Write enough context for a fresh AI agent to begin implementation from the issue alone. Do not require access to local `.wiki`, the discovery conversation, or unstated repository knowledge. Cover these sections when they apply:

- **Problem:** current and expected behavior, impact, and affected users.
- **Evidence:** exact reproduction, outputs or artifacts, stable symbols, verified root cause, ownership, and provenance. For a violation of the development skill's **Forbidden** section, prove the classification from behavior, control flow, and history instead of merely naming the prohibition. Line numbers are navigation, not proof.
- **Consequence surface:** affected consumers, states, platforms, compatibility and failure paths, plus the complete case matrix for the cause.
- **Approach:** the invariant and architectural owner, without prescribing an unverified implementation. Discovery explanations and candidate mechanisms stay hypotheses for the implementer to validate; strike a prescribed mechanism even when it appears to fit the current evidence.
- **Acceptance and verification:** positive, negative, boundary, and regression outcomes with narrow and broader proving commands.
- **Coordination:** dependencies, exclusions, migration concerns, external blockers, and related open, closed, accepted, or rejected work.

Use tables for repeated case mappings. Read the rendered issue back and keep its body as the current operative handoff; use comments only for chronology.

## Develop And Repeat The Campaign

Read [development.md](development.md) in full when the user authorizes implementation pull requests or the end of a campaign that entered implementation. It owns the single cycle pull request, empty claim, internal DAG order, test authoring, formatting, ordinary CI, red-CI repair, solo Self-Review, the integration-sensitive gate, merge, branch and temporary-asset cleanup, and renewed discovery.

An audit-only or issue-publication-only campaign does not load the development procedure or mutate repository, Actions, or GitHub state beyond the authorized publications.
