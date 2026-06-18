# Migration: Go-backed transform

> [!NOTE]
> This guide covers the **`@next`** line of Nestia, which runs on
> TypeScript-Go (`@typescript/native-preview`) hosted by `ttsc`. For the
> stable, stock-TypeScript v6 transform path, follow
> [setup](https://nestia.io/docs/setup) instead.

Nestia replaces the TypeScript-side transformer pipeline with a Go-backed binary (`ttsc-nestia`) hosted by `ttsc`. Public decorator APIs are unchanged; only your build configuration and tool chain change.

## What stayed the same

- All `@TypedBody`, `@TypedRoute`, `@TypedQuery`, `@TypedHeaders`, `@TypedParam`, `@TypedException`, `@TypedFormData`, `@PlainBody`, `@HumanRoute`, `@EncryptedBody`, `@EncryptedRoute`, `@EncryptedController`, `@EncryptedModule`, `@SwaggerCustomizer`, `@SwaggerExample`, `@WebSocketRoute`, `WebSocketAdaptor`, `DynamicModule`, `ExceptionManager`, `doNotThrowTransformError` — identical signatures.
- All `IRequest*Validator` / `IResponse*Querifier` / `IResponse*Stringifier` runtime option interfaces — identical shapes.
- `INestiaConfig` shape, `nestia.config.ts` lookup, and the CLI subcommands (`start`, `template`, `setup`, `dependencies`, `init`, `sdk`, `swagger`, `e2e`, `all`).

## What changed

### 1. `tsconfig.json` plugin entry

```diff
 {
   "compilerOptions": {
     "plugins": [
-      { "transform": "@nestia/core/lib/transform" },
+      { "transform": "@nestia/core/native/transform.cjs" }
     ]
   }
 }
```

### 2. Build command — `ttsc`, not `tsc`

The Go binary is hosted by [`ttsc`](https://www.npmjs.com/package/ttsc), a TypeScript-Go compiler driver. Stock `tsc` cannot host Go plugins.

```diff
 {
   "scripts": {
-    "build": "tsc"
+    "build": "ttsc"
   }
 }
```

### 3. Dependencies

Keep `@nestia/core`, `@nestia/fetcher`, and `typia` as runtime dependencies.
**`@nestia/sdk` is now a runtime dependency too** — the Go binary needs to
resolve it to attach SDK / Swagger / e2e metadata, and projects that serve
runtime Swagger via `NestiaSwaggerComposer` already needed it at runtime.
Install `ttsc` and `@typescript/native-preview` as devDependencies, and remove
`ts-patch` and `typia patch` postinstalls — they are no longer used.

```diff
 {
   "dependencies": {
+    "@nestia/sdk": "^11.2.0"
   },
   "devDependencies": {
-    "ts-patch": "...",
-    "@nestia/sdk": "...",
+    "ttsc": "^0.10.2",
+    "@typescript/native-preview": "..."
   },
   "scripts": {
-    "prepare": "ts-patch install && typia patch",
     "build": "ttsc"
   }
 }
```

### 4. TypeScript-Go preview pin

The Go binary hash-locks to a specific TypeScript-Go upstream commit, surfaced through `@typescript/native-preview`. Loose ranges may drift the AST contract.

```diff
- "typescript": "^5.6.0"
+ "@typescript/native-preview": "7.0.0-dev.20260505.1"
```

The legacy `typescript` package is no longer required at runtime; keep it only if your editor language service needs it.

### 5. `npx nestia setup` no longer writes `tsconfig.json` plugins

The wizard still exists — `npx nestia setup` installs the new dep / devDep
split (`ttsc` + `@typescript/native-preview` as devDependencies; `typia`,
`@nestia/core`, `@nestia/sdk`, `@nestia/fetcher` as dependencies; `nestia` as
devDependency). It no longer touches `tsconfig.json` or runs `ts-patch`,
because `ttsc` auto-discovers the Nestia transform from each package's
`package.json#ttsc.plugin` block.

You only need `compilerOptions.plugins` if you want to override transform
options (`stringify`, `llm`, etc.) — see §6.

### 6. Optional plugin composition order

If you do choose to register plugins manually (for example, to pass
`stringify` or `llm` options), the recommended shape is: typia (host
tombstone) → `@nestia/sdk/lib/transform` → `@nestia/core/native/transform.cjs`.
The `typia` entry stays with `enabled: false` — typia runs inside the Go
binary, but tooling may still inspect the entry.

```jsonc
"plugins": [
  { "transform": "typia/lib/transform", "enabled": false },
  { "transform": "@nestia/sdk/lib/transform" },
  { "transform": "@nestia/core/native/transform.cjs" }
]
```

`@nestia/sdk` ships its plugin as `lib/transform` (a thin descriptor) while `@nestia/core` ships `native/transform.cjs` (the Go binary host). The asymmetry is intentional: the Go binary inside `transform.cjs` recognizes an SDK descriptor by name and runs both transforms in one compiler pass via `composes`, so plugin order in the array does not matter.

### 7. Internal symbols removed

The `INestiaTransformOptions`, `INestiaTransformProject`, `PlainBodyProgrammer`, `TypedBodyProgrammer`, and the `programmers/` / `transformers/` directories were deleted. None were exported from `module.ts`; if your code imported them via deep paths it must be rewritten against the new pipeline or migrated to `@ttsc/factory`.

### 8. AST factory: `@ttsc/factory`

`@nestia/sdk` and `@nestia/migrate` build TypeScript source through [`@ttsc/factory`](https://www.npmjs.com/package/@ttsc/factory), a dependency-free, printer-compatible AST factory and printer that keeps working after the TypeScript-Go (tsgo) migration. Third-party code generators that previously reached into `@nestia/core`'s internal `factories/` can depend on `@ttsc/factory` directly.

### 9. Runtime requirement: Go 1.26+ on PATH

Until prebuilt binaries are distributed via optional npm dependencies, the local toolchain must have Go 1.26+ available. CI runners typically have Go preinstalled on Ubuntu images; for deterministic builds, add `actions/setup-go@v5` with `go-version-file: packages/core/native/go.mod` to your workflows.

### 10. Diagnostic format

Compilation failures now surface through `ttsc-nestia: ...` stderr. The `NoTransformConfigurationError` thrown at runtime points back to this document and to https://nestia.io/docs/setup.

### 11. Optional cache profiling: `TTSC_NESTIA_PROFILE`

Set `TTSC_NESTIA_PROFILE=1` before running `ttsc` to print per-pass cache hit / miss counters to stderr:

```bash
TTSC_NESTIA_PROFILE=1 ttsc
```

```
ttsc-nestia profile: core-cache hits=1024 misses=234
ttsc-nestia profile: sdk-cache hits=567 misses=89
```

Informational only — the counters do not affect compilation output or exit code. Useful when investigating large-codebase build times.

### 12. Panic stack opt-in: `NESTIA_NATIVE_DEBUG_STACK`

If the Go binary aborts with `nestia.internal.panic`, set `NESTIA_NATIVE_DEBUG_STACK=1` to also print the full Go stack alongside the diagnostic. Off by default to keep build output clean; turn it on only when reproducing a panic for triage.

## Quickest upgrade recipe

```bash
# 1. Drop the old patch chain
npm uninstall ts-patch

# 2. Reinstall dependencies in the new order. The runtime set matches what
#    `npx nestia setup` installs, plus `@nestia/e2e` for projects that emit
#    the generated e2e bundle (`npx nestia dependencies` adds it separately).
npm i -D ttsc @typescript/native-preview
npm i typia
npm i @nestia/core @nestia/sdk @nestia/e2e @nestia/fetcher
npm i -D nestia

# 3. Update the build script (see §2)
#    Optional: if you registered plugins manually, update the entries (§6)

# 4. Build
npm run build
```

If `ttsc` exits with `failed to compile`, run `npx ttsc -p tsconfig.json` directly to see the underlying `ttsc-nestia: ...` stderr diagnostic (this is the same output the SDK and CLI consume).
