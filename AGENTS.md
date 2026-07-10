## 1. Project

### 1.1. What Nestia Is

Nestia is a set of NestJS helper libraries built around one idea: a pure TypeScript type definition should replace the stack of decorators, validators, transformers, and Swagger annotations that NestJS normally needs. The compile-time transform reads those types and injects everything else.

The packages:

- **`@nestia/core`** — typed request/response decorators for NestJS controllers. Replaces class-validator and class-transformer with type-driven validation and serialization that runs an order of magnitude faster.
- **`@nestia/sdk`** — generators driven by the `nestia` CLI that emit Swagger documents, typed SDK libraries, mockup simulators, and automatic e2e test suites from decorated controllers. Reads metadata that the native transform attaches at build time. On the `@next` line it ships as a runtime dependency (the Go binary needs to resolve it; `NestiaSwaggerComposer` consumers needed it at runtime anyway).
- **`@nestia/fetcher`** — typed `fetch` runtime that generated SDKs sit on top of. Plain and AES-encrypted variants, with simulation support for the mockup mode.
- **`@nestia/migrate`** — converts a Swagger/OpenAPI document into a NestJS project (controllers, DTOs, optional e2e suite). Generated templates are non-interactive.
- **`@nestia/e2e`** — test utilities used by both hand-written and generated e2e suites; discovers test functions by prefix and bundles small assertion and HTTP helpers.
- **`@nestia/benchmark`** — load-test runner built on top of e2e functions; emits markdown reports.
- **`@nestia/editor`** — Swagger UI with an embedded cloud TypeScript editor.
- **`nestia`** — the CLI binary that drives `@nestia/sdk`.

Downstream projects (`@agentica`, `@autobe`) build on this stack but are not part of this repository's contract.

### 1.2. How It Works

A single Go binary under `packages/core/native` performs the compile-time transform that injects validators, stringifiers, and SDK metadata. Both `@nestia/core` and `@nestia/sdk` register that binary through their `ttsc` plugin manifests; the typia transform is composed in.

The `transform.ts` files in `@nestia/core` and `@nestia/sdk` are plugin descriptors, not transformers — there is no TypeScript-side transform anymore. Consumers reach the binary through `ttsc` / `ttsx` and the published descriptors. Inside the repo, each test workspace's `start` script uses `cross-env` to set `TTSC_GO_BINARY`, pin `TTSC_CACHE_DIR` (so the Go source-plugin build is reused across suites), and carry the required `NODE_OPTIONS`.

### 1.3. Layout

- `packages/*` — the published packages, including the shared Go plugin under `packages/core/native`.
- `tests/test-*` — feature-test workspaces. `test-e2e` and `test-migrate` are function-per-file; `test-sdk` is project-shaped (each `features/<name>` is a real nestia project); `test-transform-options` is a synthetic harness for plugin option matrices; `test-benchmark` boots a real NestJS app.
- `benchmark/` — the published benchmark workspace, with results under `benchmark/results/**`.
- `website/src/content/docs/**` — user-facing MDX guides published at `nestia.io/docs`.
- `.discussions/`, `conventions/` — multi-agent review workspace and its minutes.
- `deploy/` — release scripts.

### 1.4. Commands

```bash
pnpm install
pnpm format
pnpm build
pnpm test
```

`pnpm test` builds, then runs each test workspace's `start` script (which sets the `ttsc` env via `cross-env`). It needs `go` on `PATH` (or `TTSC_GO_BINARY`).

## 2. Development

### 2.1. Work Rules

- Match existing conventions. Before adding a file, function, or test, open a nearby peer in the same package and mirror its naming, location, and code style — don't create parallel structures.
- Respect package boundaries. The Go binary lives in `@nestia/core` and is shared with `@nestia/sdk`. Don't fork a second native binary, and don't reintroduce a TypeScript-side transformer.
- Preserve the contract. Decorator names, `INestiaConfig` options, CLI flags, and the generated SDK / Swagger / e2e surface are public. Renaming or removing any of them is a deliberate, separate change.
- Keep detection general. The native transform must locate target packages through their resolved package root, not through workspace-only path substrings — substring matching breaks the moment a consumer installs from npm. The same rule applies to generators: no hard-coded DTO, controller, or feature names.
- Use the workspace catalogs. `pnpm-workspace.yaml` pins versions under `catalog:typescript`, `catalog:samchon`, `catalog:nestjs`, `catalog:utils`, `catalog:modelcontextprotocol`, and `catalog:rolldown`. New dependencies go through the matching catalog; internal references use `workspace:^`.
- Migration templates ship without interactive dependencies — generated projects stay non-interactive.
- When public behavior changes, update the matching guide page under `website/src/content/docs/**` in the same change.

### 2.2. Testing

**One test case per file, named after what it asserts.** Applies to both layers.

- **Go unit tests** live under `packages/*/test/` and next to the native binary. One `Test*` per file, named after the assertion. Tests that exercise the CLI surface or emit pipeline should invoke the real binary (e.g. `go run ./packages/core/native/cmd/...`) so the wrapper branches stay covered.
- **TypeScript suites** under `tests/test-*` come in three shapes:
  - *Function-per-file* (`test-e2e`, `test-migrate`, and the generated tests inside `test-sdk` features): each file exports exactly one `test_<snake_case>` function with a matching file name; `DynamicExecutor` discovers them by prefix.
  - *Project-shaped* (`tests/test-sdk/features/<name>`): each directory is a real nestia project — config, tsconfig, controllers, expected outputs. The harness runs the CLI, compiles, and asserts on observable output. Directory names containing `error` are expected to fail compilation.
  - *Synthetic* (`tests/test-transform-options`): drives `ttsc` with hand-written plugin configs to verify transform options. Add new option combinations here instead of inventing new project fixtures.

Open every case with a doc comment in the same three-part shape: a one-line `Verifies …` headline, a short paragraph stating the non-obvious *why* (which branch or regression is being pinned), and a 2–4-step numbered scenario.

```ts
/**
 * Verifies @TypedBody with `validate: "assertPrune"` strips extras from
 * both input and return value.
 *
 * Locks the assertPrune branch of the native body validator. Other validate
 * modes pass the input through untouched; only the Prune family removes
 * extras, and the transformer has to pick the matching typia helper. A
 * regression in helper selection would silently fall back to a non-pruning
 * validator and let extra properties through.
 *
 * 1. Build a controller method with `@TypedBody()` and `validate: "assertPrune"`.
 * 2. Send a payload carrying an extra property.
 * 3. Assert the extra is missing from both the input and the return value.
 */
export const test_body_config_assertPrune_strips_extras = () => { /* ... */ };
```

Use the shared helpers in `@nestia/e2e` and each suite's local helpers; don't reach into another suite's internals.

### 2.3. Validation

Match the scope of the command to the scope of the change. Report any command you couldn't run.

- Touched the Go binary → `go test` in that module.
- Touched one test workspace → `pnpm --filter ./tests/<name> start`.
- Touched the transform, decorators, or generators broadly → `pnpm test`.
- Touched packaging → `pnpm package:tgz` from `deploy/tarballs` and try a clean install.

### 2.4. Change Integrity

Treat tests, fixtures, snapshots, CI workflows, package wiring, dependencies, core algorithms, and generated baselines as part of the specification. Changing them requires an explicit user request or a clear product reason, and the final report must call it out.

For mechanical ports, migrations, or broad rewrites, preserve the existing algorithm and public behavior in reviewable slices. Prefer a concrete exemplar over abstract instructions, and inspect the diff before trusting a green test run.

## 3. Documentation

User-facing guides live under `website/src/content/docs/**` and publish to `nestia.io/docs`. One audience, one task per page. Update the page's `_meta.ts` when adding or moving it.

Update `AGENTS.md` when the repository's load-bearing facts shift — the package family, the JS-descriptor / Go-plugin boundary, the test layering, the release flow. Treat it as a map, not a rulebook.

When adding agent-facing rules, state the desired workflow first. Use negative constraints only for named failure modes, and include the reason so the rule points back to the intended behavior.

## 4. Multi-Agent Workflows

Use these workflows only when the user explicitly asks for the named workflow, a multi-agent review, or a multi-agent discussion. Use Review Cycles for direct review of changed source, docs, and tests; Discussions for open-ended topic exploration; and Research Review Rounds when review needs shared research before individual proposals.

### 4.1. Review Cycles

For an explicitly requested review cycle, form a team of six agents. Each agent must read the changed source, docs, and tests in full, then propose concrete improvements.

The lead agent rechecks every proposal, verifies it against the codebase, and applies only changes that are technically sound and relevant.

That is one cycle. For the next cycle, form a fresh team of six different agents and repeat. Continue while at least one verified proposal is accepted. Stop when no agent proposes an improvement, or when no proposal survives lead-agent validation.

### 4.2. Discussions

For a discussion task, create a new topic directory under `.discussions/<topic>/`. Use a short filesystem-safe topic name. Do not delete or overwrite existing discussion directories unless the user explicitly requests it.

Form a team of six agents. Each agent researches the topic, creates a personal subdirectory under the topic directory, and continuously maintains its own wiki-style knowledge base there.

When all agents are ready, run three unrestricted discussion rounds recorded as `round1.md`, `round2.md`, and `round3.md` in the topic directory. Each round has a one-hour budget. The lead agent moderates, acts as scribe, and does not narrow the topic unless the user did.

The transcript files must record the live discussion, not a retrospective summary. The lead agent writes each statement in speaking order. Team agents read the updated transcript before speaking again and continue researching, revising their own knowledge bases, and preparing notes while waiting for their next turn.

After `round3.md` is complete, the lead agent writes the agreed conclusions and major open points into `summary.md` in the topic directory, reports them to the user, and waits for the next instruction.

### 4.3. Research Review Rounds

For an explicitly requested research review, combine the `.discussions` knowledge-base workflow with the review validation loop.

Create a new topic directory under `.discussions/<topic>/`. Each research review round gets its own `review-round-N/` subdirectory with six fresh agents, agent knowledge-base folders, `round1.md`, `round2.md`, `round3.md`, `proposals.md`, and `lead-validation.md`.

In each round, agents build their own knowledge bases from the changed source, docs, tests, and any relevant research. Run the three live discussion transcripts as in Discussions: the lead agent records statements in speaking order while team agents read each other's statements, keep researching between turns, and refine their notes.

At the end of a round, each agent submits its own concrete improvement proposals. Do not require consensus; discussion is for shared understanding, not voting. The lead agent verifies every proposal and applies only changes that are technically sound and relevant.

For the next round, replace the team with six different agents and repeat. Continue while at least one verified proposal is accepted. Stop when no meaningful proposal remains, or when no proposal survives lead-agent validation.
