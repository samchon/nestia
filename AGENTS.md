## 1. Project

### 1.1. Product Contract

Nestia is a set of helper libraries for NestJS. It ships runtime decorators, generators, runtime helpers, a CLI, and a single native compiler sidecar that backs the typed decorators and the SDK generator:

- `@nestia/core` — typed request/response decorators for NestJS controllers.
- `@nestia/sdk` — Swagger/OpenAPI generator, SDK library generator, mockup simulator, and automatic E2E test generator. Driven by the `nestia` CLI and by metadata injected at compile time.
- `@nestia/fetcher` — typed `fetch` runtime used by generated SDKs.
- `@nestia/migrate` — Swagger/OpenAPI to NestJS migration program.
- `@nestia/e2e` — test utilities used by generated and hand-written e2e suites.
- `@nestia/benchmark` — benchmark runner built on top of e2e functions.
- `@nestia/editor` — Swagger UI and cloud TypeScript editor.
- `@nestia/factory` — TypeScript AST factory used by Nestia generators.
- `nestia` — the CLI.
- A single Go native plugin under `packages/core/native` that both `@nestia/core` and `@nestia/sdk` register through their `ttsc` plugin manifests. The typia transform is composed in.

The public contract is the package API, decorator names, generated SDK surface, CLI flags, and config option names. The Go binary is internal: consumers reach it only through `ttsc`/`ttsx` and the published plugin descriptors. The JS `transform.ts` files in `@nestia/core` and `@nestia/sdk` are plugin descriptors, not the transform itself.

### 1.2. Layout

- `packages/core` — `@nestia/core`. TS sources and the shared Go plugin (the binary lives here and is reused by `@nestia/sdk`).
- `packages/sdk` — `@nestia/sdk`. TS sources for the generator; its Go tests exercise the shared binary in core.
- `packages/fetcher`, `packages/e2e`, `packages/benchmark`, `packages/factory`, `packages/migrate`, `packages/editor` — pure TypeScript packages.
- `packages/cli` — the `nestia` CLI.
- `tests/test-*` — feature-test workspaces, invoked through `tests/run-with-ttsc-env.cjs` so the Go binary and the `ttsc` cache directory are picked up.
- `tests/test-sdk/features/*` and `tests/test-migrate/fixture` — project-shaped fixtures.
- `benchmark/` — the benchmark workspace that produces results under `benchmark/results/**`.
- `website/src/content/docs/**` — public guide site published at `nestia.io/docs` (MDX).
- `.wiki/` — internal Go-port encyclopedia (porting strategy, plugin protocol notes, reviews). Not user documentation.
- `.discussions/` — multi-agent review and discussion workspace (see §4).
- `conventions/` — long-running session minutes and participant readiness templates.
- `deploy/` — release scripts.
- `config/`, `tests/config` — shared tsconfig fragments.

### 1.3. Commands

```bash
pnpm install
pnpm format
pnpm build
pnpm test
```

`pnpm test` runs the test workspaces serially after a full build. The native plugin requires a working Go toolchain on `PATH` (or `TTSC_GO_BINARY`).

## 2. Development

### 2.1. Work Rules

- Match existing conventions. Before adding a file, function, or test, open a nearby peer in the same package and mirror its naming, location, and code style — do not create parallel structures.
- Respect package boundaries. The Go binary lives in `@nestia/core`. `@nestia/sdk` and the rest do not get their own native binary; they go through the shared plugin and the published descriptors.
- Plugin descriptors are JS; transform behavior is Go. Do not reintroduce a TS-side transformer.
- Public decorator names, config option names, generated SDK surface, and CLI flags are part of the contract. Renames and removals belong in a separate, deliberate change.
- Do not hard-code consumer-specific DTO, controller, or feature names into the native transform or the generators. Detection must remain general.
- Path matching in the native transform must resolve through the published package root, not through workspace-only directory substrings.
- Migration templates ship without interactive dependencies; keep generated projects non-interactive.
- When behavior changes affect the public surface, update the matching guide page under `website/src/content/docs/**` in the same change.

### 2.2. Testing

Nestia has two test layers. Use the narrowest one that proves the change.

- **Go unit tests** live alongside the native plugin and under each package's `test/` directory. They cover in-process helpers and also run the real binary against fixture projects so the CLI surface and emit paths stay covered. One `Test*` per file, named after what it asserts.
- **TypeScript e2e tests** live in `tests/test-*`. There are two shapes:
  - *Function-per-file*: each file exports one `test_<snake_case>` function with a matching file name, discovered by prefix.
  - *Project-shaped fixture*: each feature directory is a self-contained nestia project (config, tsconfig, controllers, expected outputs). The harness runs the CLI inside the directory, compiles, and asserts on observable output. Directory names that include `error` are expected to fail compilation.
- A focused harness exists for plugin option matrices. Add new option combinations there instead of inventing new project fixtures.
- Use the shared utility package and each suite's local helpers; do not reach into another suite's internals.
- When a regression needs a real project layout (server boot, swagger emission, SDK consumption), add a fixture to the project-shaped suite. When it only needs a synthetic plugin config, extend the option-matrix harness.

For new test cases that pin a non-obvious branch, open the case with a short doc comment in the same three-part shape: a one-line `Verifies …` headline, a short paragraph stating *why* (which branch or regression is being pinned), and a 2–4-step numbered scenario.

```ts
/**
 * Verifies <what is being asserted>.
 *
 * <Short paragraph on the non-obvious why: which branch or regression
 * is being pinned, and what would silently go wrong without this test.>
 *
 * 1. <set up>
 * 2. <run>
 * 3. <assert>
 */
export const test_<snake_case> = () => { /* ... */ };
```

### 2.3. Validation

Run the narrowest command that proves the change first, then a broader one when shared behavior or packaging changed. Report any command that could not be run.

- Touched the native plugin → run Go tests in the relevant module.
- Touched one test workspace → run that workspace's start script after building the packages it depends on.
- Touched compiler or transform behavior, decorators, or generators → run the full `pnpm test`.
- Touched package metadata or anything that affects publishing → run a packed-install smoke before claiming the change is safe to release.

## 3. Documentation

### 3.1. READMEs

Each package README is for the final reader of that package — usually a NestJS author. Start with what it is, when to use it, installation, and the smallest working setup. Keep wording direct and practical; move compiler internals, plugin protocol details, and migration history into the guide site and link them only as the next step.

The root README lists the package family and links to the guide site and benchmark results. Keep it consistent with the actual packages.

### 3.2. Guide Documents

Public guides live under `website/src/content/docs/**` and are published to `nestia.io/docs`. Each page must name its reader: NestJS server author, SDK consumer, client or test author, plugin/integration author, or migration user.

Pages may go deeper than READMEs with full option tables, recipes, troubleshooting, compatibility notes, and migration details. Keep one audience and one task per page. When adding or moving a page, update its navigation metadata so it shows up in the sidebar.

Documents under `.wiki/` are not user guides. They are the working knowledge base for the Go port and follow numeric prefixes for ordering. Update them when the porting picture changes, not when the public API changes.

### 3.3. AGENTS.md Maintenance

Update `AGENTS.md` when the repository contract changes: new package families, moved directories, new commands, testing conventions, documentation policy, release flow, or coding-agent workflow rules. The boundary between the JS plugin descriptors and the single shared Go plugin, and the test layering (Go vs TS, function-per-file vs project-fixture) are load-bearing — call them out when they shift.

Keep `AGENTS.md` systematic, natural to read, and concise. Preserve the numbered H2/H3 structure, place new guidance in the smallest fitting section, and prefer direct rules over long rationale.

## 4. Multi-Agent Workflows

Use these workflows only when the user explicitly asks for the named workflow, a multi-agent review, or a multi-agent discussion. Use Review Cycles for direct review of changed source, docs, and tests; Discussions for open-ended topic exploration; and Research Review Rounds when review needs shared research before individual proposals.

`.discussions/` and `conventions/` already host live workflows. New cycles should follow the same on-disk shape so prior cycles remain readable.

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
