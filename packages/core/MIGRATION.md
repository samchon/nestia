# Migration: Go-backed transform

Nestia replaces the TypeScript-side transformer pipeline with a Go-backed binary (`ttsc-nestia`) hosted by `ttsc`. Public decorator APIs are unchanged; only your build configuration and tool chain change.

## What stayed the same

- All `@TypedBody`, `@TypedRoute`, `@TypedQuery`, `@TypedHeaders`, `@TypedParam`, `@TypedException`, `@TypedFormData`, `@PlainBody`, `@HumanRoute`, `@EncryptedBody`, `@EncryptedRoute`, `@EncryptedController`, `@EncryptedModule`, `@SwaggerCustomizer`, `@SwaggerExample`, `@WebSocketRoute`, `WebSocketAdaptor`, `DynamicModule`, `ExceptionManager`, `doNotThrowTransformError` — identical signatures.
- All `IRequest*Validator` / `IResponse*Querifier` / `IResponse*Stringifier` runtime option interfaces — identical shapes.
- `INestiaConfig` shape, `nestia.config.ts` lookup, the eight CLI subcommands (`start`, `template`, `dependencies`, `init`, `sdk`, `swagger`, `e2e`, `all`).

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
Install `ttsc` and TypeScript for transformed builds, and remove `ts-patch`
and `typia patch` postinstalls — they are no longer used.

```diff
 {
   "devDependencies": {
-    "ts-patch": "...",
+    "ttsc": "^0.10.2",
     "typescript": "~6.0.3"
   },
   "scripts": {
-    "prepare": "ts-patch install && typia patch",
     "build": "ttsc"
   }
 }
```

### 4. TypeScript version pin

The Go binary hash-locks to a specific TypeScript-Go upstream commit. Loose ranges may drift the AST contract.

```diff
- "typescript": "^5.6.0"
+ "typescript": "~6.0.3"
```

### 5. `npx nestia setup` is removed

The interactive wizard is gone. The replacement is to add the plugin entry to `tsconfig.json` directly (step 1 above) and install the dependencies in step 3. See https://nestia.io/docs/setup.

### 6. Plugin composition order is load-bearing

If you compose plugins manually, the order is fixed: typia (host tombstone) → `@nestia/sdk/lib/transform` → `@nestia/core/native/transform.cjs`. The `typia` entry must remain with `enabled: false` — typia runs inside the Go binary, but other tools may still inspect the entry.

```jsonc
"plugins": [
  { "transform": "typia/lib/transform", "enabled": false },
  { "transform": "@nestia/sdk/lib/transform" },
  { "transform": "@nestia/core/native/transform.cjs" }
]
```

### 7. Internal symbols removed

The `INestiaTransformOptions`, `INestiaTransformProject`, `PlainBodyProgrammer`, `TypedBodyProgrammer`, and the `programmers/` / `transformers/` directories were deleted. None were exported from `module.ts`; if your code imported them via deep paths it must be rewritten against the new pipeline or migrated to `@nestia/factory`.

### 8. `@nestia/factory` is a new published package

`@nestia/factory` provides a printer-compatible TypeScript AST factory used by `@nestia/sdk` and `@nestia/migrate`. Third-party code generators that previously reached into `@nestia/core`'s internal `factories/` can depend on `@nestia/factory` directly. The surface tracks internal needs but is publicly consumable.

### 9. Runtime requirement: Go 1.26+ on PATH

Until prebuilt binaries are distributed via optional npm dependencies, the local toolchain must have Go 1.26+ available. CI runners typically have Go preinstalled on Ubuntu images; for deterministic builds, add `actions/setup-go@v5` with `go-version-file: packages/core/native/go.mod` to your workflows.

### 10. Diagnostic format

Compilation failures now surface through `ttsc-nestia: ...` stderr. The `NoTransformConfigurationError` thrown at runtime points back to this document and to https://nestia.io/docs/setup.

## Quickest upgrade recipe

```bash
# 1. Update dependencies
npm install --save @nestia/core @nestia/fetcher typia
npm install --save-dev @nestia/sdk nestia ttsc@^0.10.2 typescript@~6.0.3
npm uninstall ts-patch

# 2. Update tsconfig.json plugins (see §1 above)

# 3. Update the build script (see §2)

# 4. Build
npm run build
```

If `ttsc` exits with `failed to compile`, run `npx ttsc -p tsconfig.json` directly to see the underlying `ttsc-nestia: ...` stderr diagnostic (this is the same output the SDK and CLI consume).
