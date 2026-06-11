# Claude Code Guide

This repository's canonical agent instructions live in [AGENTS.md](./AGENTS.md).
Read and follow that file first. This file is a Claude Code entry point that
summarizes the parts most likely to matter during day-to-day repository work.

## Project Shape

Nestia is a multi-package TypeScript/NestJS workspace.

- `packages/core` contains the runtime decorators and the shared Go-backed
  TypeScript transform under `packages/core/native`.
- `packages/sdk` contains the `nestia` generator implementation for Swagger,
  typed SDKs, mockups, and generated e2e suites.
- `packages/fetcher` is the runtime used by generated SDKs.
- `packages/migrate`, `packages/e2e`, `packages/benchmark`,
  `packages/factory`, and `packages/editor` are published packages with their
  own boundaries.
- `tests/test-*` are integration workspaces. Mirror nearby fixtures before
  adding new ones.
- `website/src/content/docs/**` is the user-facing documentation published at
  `nestia.io/docs`.

Do not reintroduce a TypeScript-side transformer. The `@next` line uses the
Go-backed `ttsc` plugin pipeline.

## Working Rules

- Keep diffs small, reviewable, and scoped to the issue being solved.
- Reuse existing helpers and local patterns before adding abstractions.
- Do not add dependencies unless the task explicitly requires it.
- Treat generated fixtures, snapshots, package wiring, docs, and tests as part
  of the product contract.
- If public behavior changes, update the matching guide page under
  `website/src/content/docs/**`.
- Preserve user changes in the worktree. Never reset or revert unrelated edits.

## Testing Rules

Match verification to the changed surface:

- Go/native transform changes: run `go test` in the touched native module.
- One test workspace touched: run `pnpm --filter ./tests/<name> start`.
- Decorators, transform, or generators touched broadly: run `pnpm test`.
- Packaging changes: run `pnpm package:tgz` from `deploy/tarballs` and test a
  clean install path when possible.

The normal top-level commands are:

```bash
pnpm install
pnpm format
pnpm build
pnpm test
```

`pnpm test` requires Go on `PATH` or a valid `TTSC_GO_BINARY`. In this repo's
test scripts, `TTSC_CACHE_DIR` is used so the Go source-plugin build can be
reused across suites.

## Test Fixture Conventions

Use one test case per file, named after what it asserts.

- Go tests: one `Test*` per file.
- Function-per-file TypeScript suites: export exactly one
  `test_<snake_case>` function with a matching filename.
- `tests/test-sdk/features/<name>` directories are real Nestia projects.
- `tests/test-transform-options` is for synthetic plugin option matrices.

For new TypeScript test cases, start the file with a doc comment that states:

1. What behavior is verified.
2. Why that behavior needs a regression lock.
3. A short numbered scenario.

## Git and PRs

Use the Lore commit protocol from `AGENTS.md` for commit messages. The first
line should explain why the change exists. Add useful trailers such as
`Constraint:`, `Rejected:`, `Confidence:`, `Scope-risk:`, `Directive:`,
`Tested:`, and `Not-tested:`.

When fixing GitHub issues, keep one issue per branch and PR unless the issues
are genuinely the same defect. Record verification and any known gaps in the PR
body.
