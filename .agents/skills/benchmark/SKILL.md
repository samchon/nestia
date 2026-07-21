---
name: benchmark
description: Defines nestia benchmark fixture integrity, result reporting, and publication safeguards. Use before running or modifying the benchmark workspace, changing a structure fixture or generated program, or publishing benchmark results.
---

# Benchmark

This repository owns one benchmark system. Read its procedure in full before acting:

- [performance.md](performance.md): `@samchon/nestia-benchmark` throughput of `@nestia/core` against stock NestJS, including generated programs, structure fixtures, and the per-CPU result archive.

Do not confuse it with the published `@nestia/benchmark` package under `packages/benchmark`. That package is a product — a load-test runner that drives `@nestia/e2e` functions and emits markdown reports for a user's own server — and changes to it follow the development skill, not this one. The `benchmark/` workspace at the repository root is the measurement system this skill governs.

## Measurement Integrity

- Measure the real product. Do not add benchmark-only branches, fixture-name checks, expected-answer checks, monkey patches, or agent restrictions that would be wrong for an unmeasured repository.
- Give every comparator the setup its own documentation prescribes. The NestJS comparator is meant to be an idiomatic `class-validator` / `class-transformer` application on the same adapter; measuring a deliberately underconfigured competitor invalidates the comparison.
- Keep the adapter axis honest. Every category runs Express and Fastify for both nestia and stock NestJS. A row that compares nestia on one adapter against NestJS on the other measures the adapter, not the library.
- Preserve the workload defined by the selected procedure. A faster result obtained by validating, serializing, or serving less input is not an optimization.
- Treat a surprising result as evidence that the change is not yet understood. Inspect the raw report or the generated program before accepting, explaining away, or patching around it.

## Fixture Changes

`benchmark/src/programs/` holds generated leaf programs plus hand-maintained server helpers. Edit generated `benchmark-*.ts` files through the generators under `benchmark/src/generate/`; edit the `createNest*Program.ts` helpers under `programs/*/servers/` and the DTO shapes under `benchmark/src/structures/` in place.

Both structure trees are one contract. `structures/pure/` holds the plain TypeScript DTOs that `@nestia/core` consumes, and `structures/class-validator/` holds the decorated twins the NestJS comparator consumes. They must describe the same shape; a property present in one and missing from the other silently changes the measured payload.

Finish every fixture change before publishing it:

1. Run `pnpm generate` from `benchmark/`, which regenerates the programs, formats them, and rebuilds the package.
2. Confirm every comparator receives the same structure and input for the measured row.
3. Review the generated-program diff. A stale or inconsistent generated program contaminates every later run.

Benchmark prose follows AGENTS.md `## Maintenance` and the documentation skill.

## Report Results

Every result table reported in chat or committed to the result archive must be preserved for the active pull request. When the user has authorized PR updates under the pull-request skill, maintain one sticky comment beginning with `<!-- nestia-benchmark-results -->`; update it with the latest table, report paths, and known invalid or missing categories.

If no pull request exists or no update is authorized, keep the result in the final report and mark the comment as pending. Post it only after the user creates or authorizes updating the pull request.

## Campaign Batching

When benchmark findings produce multiple implementation issues, load the issue-campaign skill and use its planning and claim procedure unchanged for the dependency DAG, claim freeze, and official GitHub `createdAt`-to-`mergedAt` duration: [Plan One Cycle Pull Request](../issue-campaign/development.md#plan-one-cycle-pull-request) for a solo campaign, or [Plan And Claim A Pull Request Wave](../multi-agent/issue-campaign.md#plan-and-claim-a-pull-request-wave) with its batch admission test, merge pressure, and grouping and split ledger when the user explicitly requested a parallel campaign. This benchmark skill continues to own workload, fixture, measurement, result, and publication integrity; do not redefine pull-request batching here.

## Campaign Cleanup

When a benchmark campaign uses a disposable worktree or an isolated measurement root, finish cleanup before marking that assignment complete. Preserve the committed result archive and compact command evidence, but remove every disposable worktree and its assigned mutable roots: `GOCACHE`, `GOTMPDIR`, `TTSC_CACHE_DIR`, generated-program scratch tree, dependency install tree, and temporary consumer or report staging tree. Go temporary assets are never reusable campaign evidence.

1. Record the measured commit, command, result paths and hashes, environment, and any retained published result archive.
2. Confirm the worktree and mutable roots contain no unreported source or result artifact.
3. Remove the mutable roots and, for an assigned disposable worktree, run `git worktree remove --force <path>` for its exact path.
4. Verify every removed root and, when applicable, worktree path no longer exists, run `git worktree prune`, delete the associated disposable local topic branch when one was created, and confirm no worktree registration remains.

If a measurement is abandoned or invalid, retain only the diagnostic record needed to explain it; remove its worktree and Go temporary assets by the same procedure.
