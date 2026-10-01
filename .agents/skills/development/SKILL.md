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
- [Evidence Adoption](#evidence-adoption)

## Forbidden

Read the [contracts skill](../contracts/SKILL.md) before changing maintained production declarations. Its common checklist owns implementation acknowledgments; scoped checklists apply by responsibility. When a failure disproves an assumption, correct its owner and remove superseded compensations in the same repair.

These four are never acceptable; choosing any one means the approach is already wrong.

- **No monkey-patching or hardcoding.** Don't special-case a consumer, a controller name, a DTO name, a fixture name, or an expected value to make output match. Fix the general logic.
- **No test-passing-only logic.** Code exists to be correct, not to turn a check green. A branch whose only purpose is to satisfy one assertion is a bug in disguise.
- **No forcing a broken design.** When the same failure keeps returning under patch after patch, the design is wrong. Stop, find the root cause, and fix the design instead of looping forever on symptoms.
- **No whack-a-mole.** Don't patch the one case that surfaced and move on. Think expansively about every case the same root cause can produce, and seal them all with coverage so the class of failure cannot recur.

## Work Rules

- Choose the principled course. Time, difficulty, and the breadth of consequences require more careful analysis and validation; they never justify a shortcut, leaving a verified consequence unaddressed, or a weaker acceptance standard.
- Match existing conventions. Before adding a file, function, or test, open a nearby peer in the same package and mirror its naming, location, and code style; don't create parallel structures.
- Respect package boundaries. The Go binary lives in `@nestia/core` and is shared with `@nestia/sdk` as a linked contributor. Don't fork a second native binary, don't give `@nestia/sdk` its own `ttsc` plugin entry, and don't reintroduce a TypeScript-side transformer.
- Keep detection general and installation-safe. The native transform must locate target packages through their resolved package root, as `packages/core/native/transform.cjs` does with `require.resolve("@nestia/sdk/package.json", { paths })` and `packages/sdk/src/transform.ts` with `createRequire(...).resolve("@nestia/sdk/package.json")`. Workspace-only path substrings break the moment a consumer installs from npm. The same rule applies to the generators: no hard-coded DTO, controller, or feature names.
- Preserve the public contract in `.agents/skills/project/SKILL.md`. Decorator names, `INestiaConfig` options, CLI flags, and the generated SDK / Swagger / e2e surface are public; renaming or removing any of them is a deliberate product change, not incidental cleanup.
- Use the workspace catalogs. `pnpm-workspace.yaml` pins versions under `catalog:typescript`, `catalog:samchon`, `catalog:nestjs`, `catalog:utils`, `catalog:modelcontextprotocol`, and `catalog:rolldown`. New dependencies go through the matching catalog; internal references use `workspace:^`.
- Migration templates ship without interactive dependencies — generated projects stay non-interactive.
- Keep local outputs local. Do not commit `.env`, the tarballs under `deploy/tarballs/`, or any tree the harnesses regenerate (`tests/test-migrate/.generated`, the generated halves of `tests/test-sdk/features/*/src/api`, `tests/test-benchmark/BENCHMARK.md`).
- When public behavior changes, update the matching page under `website/src/content/docs/**` in the same change. Follow `.agents/skills/documentation/SKILL.md`.
- Run `pnpm format` before every ordinary commit and stage the result; never commit unformatted output. One invocation [covers both the package and test trees](../project/SKILL.md#commands), so no workspace needs formatting separately. Issue campaigns move that timing rather than relaxing it, and their own procedures state when: [the solo cycle](../issue-campaign/development.md#implement-and-write-tests) and [a parallel batch](../multi-agent/issue-campaign.md#post-campaign-cleanup).

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

Go unit tests live in two dedicated package modules, not beside the source:

- `packages/core/test`, run by `pnpm --filter @nestia/core test:go`.
- `packages/sdk/test`, run by `pnpm --filter @nestia/sdk test:go`.

Each module carries `replace` directives back to `../native` (and, for the SDK, to `../../core/native`) plus the pinned typescript-go shim redirects. Use one `Test*` function per file, named after the assertion, and mirror a nearby test's package, fixture, and cleanup pattern. Exercise option, analysis and emit semantics through the owning operations in-process; reserve native-binary or installed-CLI execution for the necessary wrapper connection in the E2E population. Do not rebuild or launch a host per rule.

`tests/test-transform-options/native` is the generated-validator runtime boundary module. Its one compiled test process emits all option fixtures, alias and native-identity controls in-process and one Node verifier executes their installed typia helpers. The parent `test-transform-options` suite invokes it once; keep it in E2E selection and include its build inputs in the shared Go cache. Pure LLM rule diagnostics belong to the core unit module; one ttsc noEmit case retains the actual wrapper connection.

`packages/core/native` and `packages/sdk/native` currently contain no `*_test.go`. Root `pnpm test:go` appends `go test -count=1 ./...` in `packages/core/native` only, so a colocated test added there would run but one added under `packages/sdk/native` would be invisible to every script. Prefer the existing `test/` modules unless the case genuinely requires same-package access, and wire up a runner if it does.

Every `test:go` script passes `-count=1`, and so should a hand-run `go test`. Cacheable mode instruments the test binary to record every file a test opens, and these tests open the whole TypeScript program and its `node_modules` typings, which on Windows made one package take minutes instead of seconds. A cached pass would also be stale, because the tests read the pnpm-installed toolchain and fixtures outside Go's view.

### TypeScript suites

Root `pnpm test` starts every `tests/test-*` workspace through its `start` script. They have these shapes:

- **Function-per-file via `DynamicExecutor`:** `test-unit` and `test-boundaries` discover files under `src/features/**` whose name starts with the configured `test` prefix; test-unit's isolated browser entry discovers `src/browser/features/**`. Export exactly one `test_<snake_case>` function from a matching filename. `test-unit` owns in-process utility, generator, composer, scaffolding and browser-component decisions; `test-boundaries` owns actual CLI scaffolding, editor HTTP fetching and benchmark worker cleanup.
  - Name every non-discovered helper so it cannot match that prefix. The gate is the *filename*, not the directory: `DynamicExecutor` recurses into every subdirectory and would import a helper named `test_*.ts` wherever it lives, including the sibling `internal/` or `structures/` directory where helpers conventionally sit.
  - Both runners throw when discovery returns zero tests and derive the discovered extension from `__filename`. A hardcoded `js` extension once made a source suite pass vacuously.
  - Build the packages before either suite. Internal operations whose exports maps hide them are loaded from their built artifacts by absolute path; this does not itself make an in-process operation E2E.
- **Project-shaped:** `tests/test-sdk/features/<name>` — one directory per feature, each a real nestia project with its own `tsconfig.json` and a `nestia.config.ts`. `start.js` runs the CLI, compiles, and asserts on observable output, with a parallel worker pool and one port per feature. Within a successful feature the e2e layer is function-per-file again.
  - Ordinary successful features share one packed installation and Node consumer entries without arbitrary chunks. The installed public `ttsc` compiles each member's producer and runtime with its own compiler options; unrelated DTOs must never share a metadata collection, because that changes public clone and schema names. Plain Node loads each emitted producer, creates its actual Nest application and generates through public `NestiaSdkApplication.all()`, then a runtime child calls each exported `main` serially. Every member compiles after generation, including members with only artifact assertions; generated TypeScript outside `src` remains in that check. Function inputs retain their authored application factory; simple directory inputs use public `DynamicModule.mount()` on emitted modules. Source files, globs and exclusions delegate to the original public SDK source-input operation, preserving source-extension semantics. Actual CLI file-pattern/extension discovery, configuration/flags and distribution owners run separately through installed tools. Copied members retain authored imports/configurations and per-member cwd/manifest defaults, sit as deep as `features/` and keep outputs separate; only diagnostic cohorts need relative client imports. Package imports resolve the packed installation rather than fixture aliases into workspace builds. Entries reject zero discovery, throw on failed reports and finally close backends even when startup fails. Reads use `__dirname` and dynamic imports follow the executing file extension. Features with `error`, `distribute`, `all` or `cli-*` behavior retain separate boundaries. Each producer invocation owns its application closure and each runtime entry owns its backend; compilation, generation and runtime failures retain their member identities.
  - The directory name encodes the expected behavior. A name containing `error` **must** fail, and the harness throws if it compiles; a name containing `distribute` returns immediately after the output is cleaned, so it neither generates nor compiles; `cli-*` names drive the `--project` and `--config` flags.
  - `cli-config` and `cli-config-project` carry `nestia.configuration.ts` instead, precisely to exercise that path.
  - Mirror `tests/test-sdk/template/success/` or `template/error/` when adding a feature. They are siblings of `features/`, not entries in it.
- **Hybrid pipeline:** `test-migrate` keeps CLI and generated-consumer boundaries in its generate-migrate-compile pipeline over the real project in `fixture/`; portable generator assertions live in `test-unit/src/features/migrate`. It imports its boundary functions explicitly from `src/index.ts`. `assertFixtureSwagger` guards fixture richness (minimum path, operation, and schema counts plus `oneOf`, multipart, plain-text, and both security schemes); keep the fixture above those thresholds rather than lowering them.
- **Benchmark-driven:** `test-benchmark` boots a real NestJS app and runs `DynamicBenchmarker` over `src/features/test_api_*.ts`.
- **Transform wrapper and runtime boundary:** `tests/test-transform-options` invokes its native Go runtime batch once, then retains actual ttsc version, disabled-host, noEmit, v11-list and programmatic-envelope connections plus fallback HTTP. Generated mode arguments are observed through a module-local VM probe resolving installed helpers; the global module loader is unchanged. The exported `main` and `verifyOptions` are enrolled in Evidence and aggregate named failures. An expected wrapper compile rejection uses `fail: true` and specific diagnostic assertions, rather than a feature directory name. Add native option combinations to the existing batch, and retain another wrapper request only for a distinct wrapper state.

- **Evidence process boundaries:** `test-evidence` uses Node's test runner over exported `.mjs` cases. It tests the installed checker and the repository's aggregate runners through actual child invocations and controlled fixtures.

Keep code under a JSDoc `@example` unfenced. The JSDoc formatter can emit a closing fence with a trailing semicolon and move acknowledgment tags behind it, making the checker read those tags as example code. Use a description-level fenced block when a displayed fence is needed, and separate acknowledgment tags from prose with a blank comment line.

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

- **One Go module:** `pnpm --filter @nestia/core test:go` or `pnpm --filter @nestia/sdk test:go`; root `pnpm test:go` runs both plus `go test -count=1 ./...` in `packages/core/native`.
- **One TypeScript workspace:** `pnpm --filter ./tests/<name> start`.
- **Unit population:** `pnpm test:unit` runs utility/SSR units and browser-component units in separate TypeScript processes sharing prepared packages and native caches. The browser entry discovers `test-unit/src/browser/features/**`, isolating DOM-dependent module initialization from the other units. Both populations run even if the first fails. `pnpm test:go` runs the two native test modules. SDK build assertions invoke the registered native dispatcher in-process rather than spawning a Go host per case.
- **E2E population:** after `pnpm build`, run `pnpm test:e2e`. `scripts/run-e2e.cjs` runs every boundary suite even when an earlier suite fails, reuses fresh SDK package builds, then builds and tests the benchmark system. A failed benchmark build prevents only its dependent test. `test.yml` runs Evidence, Go, unit and E2E in one job after one installation and package build, without a matrix; target eight minutes through shared preparation while preserving assertions.
- **One `test-sdk` feature:** `pnpm --filter ./tests/test-sdk start -- --only <substring>`, which runs only the features whose name contains that substring. `--from <name>` resumes lexicographically. `TEST_SDK_SKIP_BUILD=1` reuses current package builds, refusing stale sources. CI runs every feature in one job without shards; cohorts share the packed installation and Node consumer processes while installed `ttsc` compiles independent producer/runtime programs with their own metadata collections. `consumer.cjs` packs fresh packages, pins actual external tool versions and prepares one real installation. Owned trees resolve packages through ordinary directory links. Necessary CLI/compiler wrappers come from that installation; project compilation goes through installed public `ttsc` and its registered plugin descriptors. Packed children have no workspace `NODE_PATH` fallback or global resolver override. Installation removal follows all consuming children.
- **One package:** `pnpm --filter ./packages/<name> build`.
- **Transform, decorators, or generators broadly:** `pnpm test`; use `pnpm build` as the faster compilation gate.
- **Packaging:** run root `pnpm package:tgz`, then inspect or smoke-test a clean install. `deploy/verify-package-exports.cjs` already runs inside the `fetcher`, `migrate`, and `editor` builds; trust its failure over a green typecheck.
- **Website or guide changes:** run root `pnpm install` and `pnpm run package:tgz` first, because `website/package.json` depends on `../deploy/tarballs/editor.tgz` and `../deploy/tarballs/migrate.tgz`. Then run `npm install --force && npm run build` inside `website/`, which also rebuilds `@nestia/migrate` and `@nestia/editor` and runs TypeDoc into `public/api`.

Verification shape depends on the change type:

- **Bug fix:** name the failing case and the expected behavior; run a repro that fails before the fix and passes after.
- **Feature:** name the observable behavior; exercise it end-to-end.
- **Refactor:** name what should stay unchanged; rely on the existing test suite or a behavior-locking probe.
- **Review:** name concrete risks, missing tests, or regressions.

Each `test-sdk` producer and runtime request runs once with visible diagnostics. A failed compilation or intermittent transport result remains a failed feature while unrelated features continue; do not repeat project preparation merely to reveal its output or replace an earlier failure with a later pass. The eight-minute CI target requires shared preparation and preserved first-failure evidence.

## Change Integrity

Treat tests, fixtures, snapshots, CI workflows, package wiring, dependencies, core algorithms, generated baselines, and benchmark results as part of the specification. Changing them requires an explicit user request or a clear product reason, and the final report must call it out.

Go source under `packages/*/native` must ship under a version newer than the latest published packages. The npm packages ship their `native/` trees and ttsc compiles that source on first use, so without a new package version npm consumers keep installing the previous native source tree.

One maintainer-owned release change assigns that version, where `bumpp -r` moves all eight packages together. Multiple unreleased native changes belong to the same future release instead of consuming one patch number each, and no implementation pull request changes a `version` field. A release change may begin only after campaign completion, or after the user explicitly suspends the campaign and lifts the freeze, and it uses the version the user assigned.

For mechanical ports, migrations, or broad rewrites, preserve the existing algorithm and public behavior in reviewable slices. Prefer a concrete exemplar over abstract instructions, and inspect the diff before trusting a green test run.

## Evidence Adoption

Each package's `evidence.config.json` selects the files that directly declare its maintained TypeScript types and functions and, for `@nestia/core` and `@nestia/sdk`, the Go types and functions under `native/`, and references `contracts/common.md` under `../../.agents/skills`. Pure re-export barrels own no selected declaration and are excluded; review their public wiring through package and consumer checks while selecting each symbol at its direct declaration. A file that mixes a declaration with a foreign re-export or an ambient `declare module` block is split so the declaration owner stays selected, because the checker resolves only relative modules inside the selected source root. Hand-written `.d.ts` files for untyped dependencies own no implementation and are excluded. Properties keep native documentation and are reviewed through their type. Add the portability and performance chapters only to the operations that own those decisions. Tests have their own selection in `tests/evidence.config.json` and always answer `contracts/testing.md`; an actual E2E boundary also answers `contracts/e2e.md`.

Run root `pnpm evidence` to collect every owner without stopping at its first failure: it runs each package owner, then `tests/evidence.config.json`, then the root `evidence.config.json` that enrolls the runner itself, and exits 2 when any analysis was incomplete, 1 when only obligations are missing, and 0 otherwise. Use `pnpm --filter <package> evidence` for one package and `pnpm evidence:tests` for tests. JSON configuration keeps the checker independent of the native plugin this repository ships. `.github/workflows/test.yml` runs the command together with every test population; its path filter covers the full contract surface. Acknowledgments do not replace behavioral tests.

The root `deploy/**` scripts are top-level script bodies with no exported declaration the adapter can address, so they are review-only.

1. Finish the complete report before repairing obligations. Group missing answers, code and documentation defects, selection mistakes, and incomplete analysis by cause.
2. Inspect each selected declaration and its private helpers against every applicable chapter. Fix verified defects before writing the answer; the acknowledgment describes the resulting implementation.
3. Write `@evidence contracts/<document>.md#<anchor> <reason>` in native documentation, separated from descriptive prose by a blank comment line. Address the actual question for that declaration. Use `@evidenceExclude` only for a genuinely inapplicable individual chapter with its concrete reason.
4. Inspect public addresses with `pnpm exec evidence list --config <config>` and resolution with `pnpm exec evidence inspect '<target>' --config <config>`. Account for private helpers, anonymous callbacks, dynamically registered cases, script entry bodies, and compile-only cases that the adapter cannot address. Make executable entries selectable where practical; record remaining review-only coverage honestly.
5. Recheck the complete population after each coherent repair. Verify composed claims together, including local re-export resolution.

Do not weaken severity, narrow a maintained population, add generic compliance prose, or exclude a whole document to silence obligations. Exclude generated output, copied fixture input, dependencies, and build output only with verified provenance. Authored generators and helpers remain maintained source. Verify selection against the actual runners rather than inferring enrollment from globs.
