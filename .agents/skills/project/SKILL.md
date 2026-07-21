---
name: project
description: Defines the nestia product contract, workspace layout, package boundaries, the Go plugin composition model, and canonical commands. Use when orienting in the repository, working inside any package, or choosing a build, test, or format command.
---

# Project Outline

## Product Contract

Nestia is a set of NestJS helper libraries built around one idea: a pure TypeScript type definition should replace the stack of decorators, validators, transformers, and Swagger annotations that NestJS normally needs. The compile-time transform reads those types and injects everything else.

All eight packages publish from `packages/*` at one shared version and move together on release:

- **`@nestia/core`**: typed request/response decorators for NestJS controllers (`TypedRoute`, `TypedBody`, `TypedParam`, `TypedQuery`, `TypedFormData`, `TypedHeaders`, `TypedException`, `WebSocketRoute`, `McpRoute`, and the Swagger customizers). Replaces class-validator and class-transformer with type-driven validation and serialization. Owns the shared Go transform under `native/`.
- **`@nestia/sdk`**: generators for Swagger documents, typed SDK libraries, mockup simulators, and automatic e2e suites, driven by the `nestia` CLI. Its Go code under `native/sdk` is a contributor linked into the `@nestia/core` host binary, not a second plugin. `website/src/content/docs/setup.mdx` documents it as a runtime dependency, not a dev dependency: the Go binary must resolve it, and `NestiaSwaggerComposer` consumers need it at runtime anyway.
- **`@nestia/fetcher`**: the typed `fetch` runtime that generated SDKs sit on. Plain and AES-encrypted variants, with simulation support for mockup mode.
- **`@nestia/migrate`**: converts a Swagger/OpenAPI document into a NestJS project or SDK. Generated templates ship without interactive dependencies.
- **`@nestia/e2e`**: test utilities for hand-written and generated e2e suites. `DynamicExecutor` discovers test functions by prefix; `TestValidator`, `ArrayUtil`, and `RandomGenerator` are the shared assertion and data helpers.
- **`@nestia/benchmark`**: a published load-test runner (`DynamicBenchmarker`) that drives e2e functions and emits markdown reports for a user's own server.
- **`@nestia/editor`**: Swagger UI with an embedded cloud TypeScript editor, shipped as both a static app and a `NestiaEditorModule` library.
- **`nestia`**: the CLI binary that drives `@nestia/sdk`.

Downstream projects (`@agentica`, `@autobe`) build on this stack but are not part of this repository's contract.

Decorator names, `INestiaConfig` options, CLI flags, the `@nestia/fetcher` runtime surface, and the generated SDK / Swagger / e2e output are all public. Renaming or removing any of them is a deliberate, separate change.

## How The Transform Composes

A single Go binary performs the compile-time transform that injects validators, stringifiers, and SDK metadata. There is no TypeScript-side transformer, and reintroducing one is out of bounds.

`packages/core/package.json` is the only package that registers a `ttsc` plugin:

```json
"ttsc": { "plugin": { "transform": "@nestia/core/native/transform.cjs" } }
```

That manifest target, `packages/core/native/transform.cjs`, is the operative descriptor. It declares three things:

- **`source`**: the Go entrypoint at `<@nestia/core root>/native/cmd/ttsc-nestia`, which ttsc compiles into a binary on first use.
- **`composes: ["typia/lib/transform"]`**: the typia transform is composed in rather than reimplemented.
- **`contributors`**: `<@nestia/sdk root>/native/sdk`, resolved and added only when `@nestia/sdk` is resolvable from the consuming project.

`packages/core/src/transform.ts` and `packages/sdk/src/transform.ts` are plugin descriptors, not transformers. Each resolves its own installed package root through `createRequire(...).resolve("<pkg>/package.json")` and returns the Go entrypoint. `packages/sdk` deliberately has no `ttsc` key: its Go source is `package sdk`, a non-main package that ttsc statically links into the core host binary. Adding a second plugin entry for `@nestia/sdk` is a misconfiguration, and `tests/test-transform-options` records that in a source comment.

Consumers reach the binary through `ttsc` / `ttsx` and the published descriptors. Inside the repo, every test workspace's `start` script uses `cross-env` to carry the `NODE_OPTIONS="--no-experimental-strip-types --no-experimental-detect-module"` that Node 24 needs. Five of them additionally set `TTSC_GO_BINARY=go` and pin `TTSC_CACHE_DIR` so the Go source-plugin build is reused; `test-e2e`, `test-migrate`, and `test-benchmark` point it at the shared root cache, `test-sdk` reaches the same cache from inside `features/<name>/`, and `test-transform-options` deliberately keeps a workspace-local one. `test-cli` and `test-editor` set neither variable, because they build the package under test first and exercise its built artifacts rather than compiling through the plugin.

## Layout

- `packages/*`: the eight published packages. The shared Go plugin lives under `packages/core/native` (module `github.com/samchon/nestia/packages/core/native`, with `cmd/ttsc-nestia` and the 17-file `transform/` tree); the SDK contributor lives under `packages/sdk/native/sdk`. Both `native/go.work` files carry the same fifteen `replace` directives: fourteen redirect the `github.com/microsoft/typescript-go/shim/*` modules to a pinned `github.com/samchon/ttsc` pseudo-version, and the fifteenth redirects `github.com/samchon/ttsc/packages/ttsc` itself.
- `packages/core/test` and `packages/sdk/test`: the Go test modules, each its own module — core's replaces `../native`, the SDK's replaces both `../native` and `../../core/native`. All 77 tracked `*_test.go` files live here; `native/` itself carries none.
- `tests/test-*`: seven feature-test workspaces. `start` is the single entry contract for every one of them. See `.agents/skills/development/SKILL.md` for their shapes.
- `tests/config/tsconfig.json`: the shared strict base config. Five workspaces extend it directly, and every one of `test-sdk`'s 161 feature projects extends it as `../../../config/tsconfig.json`. Not a package.
- `config/`: `@nestia/config`, the private workspace holding the shared rolldown and tsconfig build configuration.
- `benchmark/`: `@samchon/nestia-benchmark`, the private measurement workspace, with committed per-CPU results under `benchmark/results/**`. See `.agents/skills/benchmark/SKILL.md`.
- `website/`: the Nextra site published at https://nestia.io, with guides under `website/src/content/docs/**`. See `.agents/skills/documentation/SKILL.md`.
- `deploy/`: release scripts — `tarballs/index.js` (topologically ordered `pnpm pack`), `README.bash` (distributes the root README), `release-guard.cjs` (release context and version uniformity), and `verify-package-exports.cjs` (proves every `main`, `types`, `bin`, and `exports` leaf resolves).

## Commands

The `build`, `test`, and `release` workflows run Node 24.x with Go taken from `packages/core/native/go.mod`; `website.yml` runs `lts/*` and installs no Go. The workspace pins pnpm exactly to 10.6.4.

```bash
pnpm install
pnpm format
pnpm build
pnpm test
```

`pnpm test` builds, then runs `pnpm test:go`, then runs each `tests/test-*` workspace's `start` script at `--workspace-concurrency=1`. The whole chain needs `go` on `PATH`, and sets `TTSC_GO_BINARY=go`, `TTSC_CACHE_DIR=node_modules/.cache/ttsc`, and the `NODE_OPTIONS` pair.

`pnpm format` is one Prettier invocation over `packages/**/*.ts` and `tests/**/*.ts`. It does not touch Go, Markdown, MDX, the website, or the benchmark workspace.

It used to chain three invocations with `&&`, the second over a `internals/**/*.ts` directory that does not exist. Prettier exits 2 on a glob that matches nothing, so the chain aborted after the first invocation and `tests/**/*.ts` was never formatted. Keep the targets in one invocation: a chain lets an unmatched pattern silently drop every target after it.

Release-time commands (most contributors skip these): `pnpm package:rc`, `pnpm package:next`, `pnpm package:latest`, and `pnpm release`. `pnpm package:tgz` stages local tarballs in `deploy/tarballs/`, which the website build then installs. See `.agents/skills/pull-request/SKILL.md` for the remote delivery flow.
