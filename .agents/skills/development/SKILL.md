---
name: development
description: Defines nestia implementation rules, testing standards, validation, consequence analysis, and change integrity. Use before writing or modifying source, tests, workflows, package wiring, fixtures, generated baselines, or algorithms.
---

# Development

## Contents

- [Forbidden](#forbidden)
- [Work Rules](#work-rules)
- [Consequence Analysis](#consequence-analysis)
- [Plugin Configuration](#plugin-configuration)
- [Testing](#testing)
- [Validation](#validation)
- [Change Integrity](#change-integrity)

## Forbidden

These four are never acceptable; choosing any one means the approach is already wrong.

- **No monkey-patching or hardcoding.** Don't special-case a consumer, a controller name, a DTO name, a fixture name, or an expected value to make output match. Fix the general logic.
- **No test-passing-only logic.** Code exists to be correct, not to turn a check green. A branch whose only purpose is to satisfy one assertion is a bug in disguise.
- **No forcing a broken design.** When the same failure keeps returning under patch after patch, the design is wrong. Stop, find the root cause, and fix the design instead of looping forever on symptoms.
- **No whack-a-mole.** Don't patch the one case that surfaced and move on. Think expansively about every case the same root cause can produce, and seal them all with coverage so the class of failure cannot recur.

## Work Rules

- Choose the principled course. Time, difficulty, and the breadth of consequences require more careful analysis and validation; they never justify a shortcut, leaving a verified consequence unaddressed, or a weaker acceptance standard.
- Match existing conventions. Before adding a file, function, or test, open a nearby peer in the same package and mirror its naming, location, and code style; don't create parallel structures.
- Respect package boundaries. The Go binary lives in `@nestia/core` and is shared with `@nestia/sdk` as a linked contributor. Don't fork a second native binary, don't give `@nestia/sdk` its own `ttsc` plugin entry, and don't reintroduce a TypeScript-side transformer.
- Keep detection general and installation-safe. The native transform must locate target packages through their resolved package root, as `packages/core/src/transform.ts` does with `createRequire(...).resolve("@nestia/core/package.json")`. Workspace-only path substrings break the moment a consumer installs from npm. The same rule applies to the generators: no hard-coded DTO, controller, or feature names.
- Preserve the public contract in `.agents/skills/project/SKILL.md`. Decorator names, `INestiaConfig` options, CLI flags, and the generated SDK / Swagger / e2e surface are public; renaming or removing any of them is a deliberate product change, not incidental cleanup.
- Use the workspace catalogs. `pnpm-workspace.yaml` pins versions under `catalog:typescript`, `catalog:samchon`, `catalog:nestjs`, `catalog:utils`, `catalog:modelcontextprotocol`, and `catalog:rolldown`. New dependencies go through the matching catalog; internal references use `workspace:^`.
- Migration templates ship without interactive dependencies — generated projects stay non-interactive.
- Keep local outputs local. Do not commit `.env`, the tarballs under `deploy/tarballs/`, or any tree the harnesses regenerate (`tests/test-migrate/.generated`, the generated halves of `tests/test-sdk/features/*/src/api`, `tests/test-benchmark/BENCHMARK.md`).
- When public behavior changes, update the matching page under `website/src/content/docs/**` in the same change. Follow `.agents/skills/documentation/SKILL.md`.
- Run `pnpm format` before every ordinary commit and stage the result; never commit unformatted output. The script currently stops short of `tests/**/*.ts` for the reason recorded in `.agents/skills/project/SKILL.md`, so format a test-workspace change explicitly. A solo issue campaign formats its unified cycle pull request. The sole exception is an explicit multi-agent campaign implementation batch: those pull requests must not run the repository-wide formatter, and that procedure performs one dedicated Post-Campaign Cleanup format pull request after the campaign ends.

## Consequence Analysis

Treat a reported example as one witness of a cause, not the complete problem statement. Before changing code, trace the same cause through:

- every caller and downstream consumer, including the generated SDK, Swagger document, mockup simulator, and e2e suite;
- normal, error, and recovery state transitions;
- both HTTP adapters — a decorator or transform change that behaves differently on Express and Fastify is two behaviors, not one;
- concurrency, caching, and generated output;
- Windows and POSIX behavior;
- compatibility constraints and boundary inputs.

Fix the verified class of failure, not only the reported witness. Cover positive, negative, and boundary cases without expanding the user's product goal.

## Plugin Configuration

`ttsc` discovers nestia from the `ttsc.plugin.transform` entry in `packages/core/package.json`, which points at `packages/core/native/transform.cjs`. That descriptor owns the composition model documented in `.agents/skills/project/SKILL.md`: the `cmd/ttsc-nestia` Go source, `composes: ["typia/lib/transform"]`, and the conditional `@nestia/sdk` contributor.

Keep type analysis, AST rewriting, diagnostics, and transform options on the Go side. Consumer projects add a `compilerOptions.plugins` entry only when they need to set optional transform flags.

Test workspaces point at `@nestia/core/native/transform.cjs`. Do not add a second plugin host, or a separate `@nestia/sdk` plugin entry, to make a local layout pass.

## Testing

**One test case per file, named after what it asserts.** This is the rule for new and changed cases in both languages, even where older files predate it. Nothing enforces it mechanically — `DynamicExecutor` gates on the `test` prefix only and will happily run a file exporting three functions or one whose export name disagrees with its filename — so the discipline is yours to keep.

### Go tests

All tracked Go tests live in two dedicated modules, not beside the source:

- `packages/core/test` (58 files), run by `pnpm --filter @nestia/core test:go`.
- `packages/sdk/test` (19 files), run by `pnpm --filter @nestia/sdk test:go`.

Each module carries `replace` directives back to `../native` (and, for the SDK, to `../../core/native`) plus the pinned typescript-go shim redirects. Use one `Test*` function per file, named after the assertion, and mirror a nearby test's package, fixture, and cleanup pattern. Tests that exercise the CLI surface or the emit pipeline should invoke the real binary so the wrapper branches stay covered.

`packages/core/native` and `packages/sdk/native` currently contain no `*_test.go`. Root `pnpm test:go` appends a bare `go test ./...` in `packages/core/native` only, so a colocated test added there would run but one added under `packages/sdk/native` would be invisible to every script. Prefer the existing `test/` modules unless the case genuinely requires same-package access, and wire up a runner if it does.

### TypeScript suites

Root `pnpm test` starts every `tests/test-*` workspace through its `start` script. They have these shapes:

- **Function-per-file via `DynamicExecutor`:** `test-e2e`, `test-cli`, and `test-editor` discover files under `src/features/**` whose name starts with the configured `test` prefix. Export exactly one `test_<snake_case>` function from a matching filename. Non-discovered helpers conventionally sit in a sibling `internal/` or `structures/` directory, but the gate is on the *filename*, not the directory: `DynamicExecutor` recurses into every subdirectory and would import a helper named `test_*.ts` wherever it lives. Name helpers so they cannot match. `test-e2e` and `test-editor` additionally throw when discovery returns zero tests; that guard exists because a hardcoded `js` extension once made a suite pass vacuously, and the extension is now derived from `__filename` at runtime. `test-cli` and `test-editor` build the package under test first, because their harnesses `require()` built artifacts by absolute path that the exports map does not expose.
- **Project-shaped:** `tests/test-sdk/features/<name>` — 161 directories, each a real nestia project with its own `tsconfig.json` and a `nestia.config.ts` (except `cli-config` and `cli-config-project`, which use `nestia.configuration.ts` precisely to exercise that path). `start.js` runs the CLI, compiles, and asserts on observable output, with a parallel worker pool and one port per feature. Behavior is encoded in the directory name: a name containing `error` **must** fail and the harness throws if it compiles, a name containing `distribute` returns immediately after the output is cleaned so it neither generates nor compiles, and the `cli-*` names drive `--project` / `--config` flags. Mirror `tests/test-sdk/template/success/` or `template/error/` — they are siblings of `features/`, not entries in it — when adding a feature. Within a successful feature the e2e layer is function-per-file again.
- **Hybrid pipeline:** `test-migrate` has function-per-file features but imports and calls them by hand from `src/index.ts`, wrapped in a generate-migrate-compile pipeline over the real project in `fixture/`. `assertFixtureSwagger` guards fixture richness (minimum path, operation, and schema counts plus `oneOf`, multipart, plain-text, and both security schemes); keep the fixture above those thresholds rather than lowering them.
- **Benchmark-driven:** `test-benchmark` boots a real NestJS app and runs `DynamicBenchmarker` over `src/features/test_api_*.ts`.
- **Synthetic:** `tests/test-transform-options` drives `ttsc` with hand-written project files and inspects the arguments the transform baked into the decorator calls, using `Module._load` capture stubs. Its cases are tables in `start.js` (`VALIDATE_CASES`, `STRINGIFY_CASES`, `LLM_CASES`), and an expected compile failure is the `fail: true` flag rather than a directory name. Add new option combinations here instead of inventing new project fixtures.

Use the shared helpers in `@nestia/e2e` and each suite's local `internal/` helpers. Do not reach into another suite's internals.

Open every new or materially changed case with a doc comment in the same three-part shape: a one-line `Verifies ...` headline, a short paragraph stating the non-obvious _why_ (which branch or regression is being pinned), and a 2+-step numbered list summarizing the scenario.

```ts
/**
 * Verifies @TypedBody with `validate: "assertPrune"` strips extras from both
 * input and return value.
 *
 * Locks the assertPrune branch of the native body validator. Other validate
 * modes pass the input through untouched; only the Prune family removes
 * extras, and the transform has to pick the matching typia helper. A
 * regression in helper selection would silently fall back to a non-pruning
 * validator and let extra properties through.
 *
 * 1. Build a controller method with `@TypedBody()` and `validate: "assertPrune"`.
 * 2. Send a payload carrying an extra property.
 * 3. Assert the extra is missing from both the input and the return value.
 */
export const test_body_config_assertPrune_strips_extras = (): void => {
  /* ... */
};
```

### Coverage, not happy paths

A test that only feeds a controller its ordinary valid input and asserts a 200 proves one path, not correctness. The transform spans validators, serializers, Swagger metadata, SDK emit, mockup simulators, and diagnostics; each predicate or branch needs more than its happy path:

- **The transformation direction.** When a call should be rewritten, assert observable emitted or runtime behavior that differs from the untransformed stub. For the generators, start from a hand-written controller and verify the generated SDK, Swagger, or e2e output — not merely that an existing output still compiles.
- **A negative twin for every positive.** Wherever a predicate accepts, rewrites, narrows, serializes, or reports a diagnostic, pin an adjacent case one property away where it must not do so. An over-match stays invisible until the counter-example exists. `test-sdk`'s `error` features are this rule expressed as directories.
- **Boundaries.** Cover the empty case, the single-element case, recursion limits, optional and nullable members, exact numeric limits, deepest nesting, and the decorator option or compiler flag that flips the decision.
- **Oracle-derived expectations.** Take expected behavior from TypeScript semantics, the NestJS contract, and the authoritative OpenAPI specification — never from whatever the current code happens to emit. A snapshot written against the implementation's own output locks its bugs in.

## Validation

Run the narrowest command that proves the change first, then a broader command when shared behavior, the transform, packaging, or documentation changed. Report any command that could not be run.

- **One Go module:** `pnpm --filter @nestia/core test:go` or `pnpm --filter @nestia/sdk test:go`; root `pnpm test:go` runs both plus `go test ./...` in `packages/core/native`.
- **One TypeScript workspace:** `pnpm --filter ./tests/<name> start`.
- **One `test-sdk` feature:** `pnpm --filter ./tests/test-sdk start -- --only <substring>`, which runs only the features whose name contains that substring. `--from <name>` resumes lexicographically, and `TEST_SDK_SKIP_BUILD=1` reuses the current package builds.
- **One package:** `pnpm --filter ./packages/<name> build`.
- **Transform, decorators, or generators broadly:** `pnpm test`; use `pnpm build` as the faster compilation gate.
- **Packaging:** run root `pnpm package:tgz`, then inspect or smoke-test a clean install. `deploy/verify-package-exports.cjs` already runs inside the `fetcher`, `migrate`, and `editor` builds; trust its failure over a green typecheck.
- **Website or guide changes:** run root `pnpm install` and `pnpm run package:tgz` first, because `website/package.json` depends on `../deploy/tarballs/editor.tgz` and `../deploy/tarballs/migrate.tgz`. Then run `npm install --force && npm run build` inside `website/`, which also rebuilds `@nestia/migrate` and `@nestia/editor` and runs TypeDoc into `public/api`.

Verification shape depends on the change type:

- **Bug fix:** name the failing case and the expected behavior; run a repro that fails before the fix and passes after.
- **Feature:** name the observable behavior; exercise it end-to-end.
- **Refactor:** name what should stay unchanged; rely on the existing test suite or a behavior-locking probe.
- **Review:** name concrete risks, missing tests, or regressions.

A `test-sdk` e2e feature gets three silent attempts and then one final attempt with inherited stdio, so the output you see belongs to a fourth run. Do not read a pass that needed retries as a clean result; an intermittent failure is a finding.

## Change Integrity

Treat tests, fixtures, snapshots, CI workflows, package wiring, dependencies, core algorithms, generated baselines, and benchmark results as part of the specification. Changing them requires an explicit user request or a clear product reason, and the final report must call it out.

Go source under `packages/*/native` must ship under a version newer than the latest published packages, because the npm packages ship their `native/` trees and ttsc compiles that source on first use; without a new package version, npm consumers keep installing the previous native source tree. Assign that version once in a maintainer-owned release change, where `bumpp -r` moves all eight packages together; multiple unreleased native changes belong to the same future release instead of consuming one patch number each. Issue implementation pull requests never change package versions. A maintainer-owned release change may begin only after campaign completion, or after the user explicitly suspends the campaign and lifts the freeze, and it uses the version the user assigned. See `.agents/skills/pull-request/SKILL.md`.

For mechanical ports, migrations, or broad rewrites, preserve the existing algorithm and public behavior in reviewable slices. Prefer a concrete exemplar over abstract instructions, and inspect the diff before trusting a green test run.
