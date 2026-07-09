# Migration: TypeScript 7 and ttsc

Nestia's `@next` transform runs through `ttsc` on TypeScript 7. Public
decorator APIs stay the same; the migration is about packages, build commands,
and optional transform configuration.

## What stayed the same

- All `@TypedBody`, `@TypedRoute`, `@TypedQuery`, `@TypedHeaders`,
  `@TypedParam`, `@TypedException`, `@TypedFormData`, `@PlainBody`,
  `@HumanRoute`, `@EncryptedBody`, `@EncryptedRoute`,
  `@EncryptedController`, `@EncryptedModule`, `@SwaggerCustomizer`,
  `@SwaggerExample`, `@WebSocketRoute`, `WebSocketAdaptor`, `DynamicModule`,
  `ExceptionManager`, and `doNotThrowTransformError` signatures.
- All `IRequest*Validator`, `IResponse*Querifier`, and
  `IResponse*Stringifier` runtime option interfaces.
- `INestiaConfig`, `nestia.config.ts` lookup, and generator commands such as
  `init`, `sdk`, `swagger`, `e2e`, and `all`.

## Install

Install `ttsc` and TypeScript 7 as dev dependencies. Keep `typia`,
`@nestia/core`, `@nestia/sdk`, and `@nestia/fetcher` as runtime dependencies.
Add `@nestia/e2e` when the project emits generated e2e suites.

```bash
npm i -D ttsc typescript
npm i typia @nestia/core @nestia/sdk @nestia/fetcher
npm i @nestia/e2e
npm i -D nestia
```

`@nestia/sdk` is a runtime dependency because the transform resolves it while
attaching SDK, Swagger, and e2e metadata. Runtime Swagger composition through
`NestiaSwaggerComposer` also needs it.

## Build

Use `ttsc` for compiled builds and `ttsx` for direct TypeScript execution.
Stock `tsc`, `ts-node`, `tsx`, and `nest build` do not run the Nestia
transform.

```diff
 {
   "scripts": {
-    "build": "tsc",
+    "build": "ttsc",
     "start": "node dist/main.js"
   }
 }
```

If the project has a `tsconfig.build.json`, point the build script at it:

```json
{
  "scripts": {
    "build": "ttsc -p tsconfig.build.json"
  }
}
```

## Transform configuration

Do not add `compilerOptions.plugins` for the default Nestia setup. `ttsc`
discovers the `@nestia/core`, `@nestia/sdk`, and `typia` transforms from the
installed package manifests.

No plugin config means these defaults apply:

- `@TypedBody` uses `"validate"`.
- `@TypedRoute` uses `"assert"`.
- LLM schema restrictions are off.

Add `compilerOptions.plugins` only when you want to override those options:

```jsonc
{
  "compilerOptions": {
    "plugins": [
      { "transform": "typia/lib/transform", "enabled": false },
      {
        "transform": "@nestia/core/native/transform.cjs",
        "validate": "validatePrune",
        "stringify": "validate.log",
        "llm": { "strict": true }
      }
    ]
  }
}
```

The `typia` entry is a host tombstone for tools that inspect plugin arrays.
The actual typia transform is composed by the native Nestia binary.

## CLI setup flow

The CLI no longer provides an interactive setup command. Install packages and
edit scripts directly; use `npx nestia init` only when you want a starter
`nestia.config.ts`.

## Internal symbols removed

`INestiaTransformOptions`, `INestiaTransformProject`, `PlainBodyProgrammer`,
`TypedBodyProgrammer`, and the old `programmers/` and `transformers/`
directories were internal implementation details. If third-party code imported
them through deep paths, move that code to the native transform pipeline or to
`@ttsc/factory`.

## AST factory

`@nestia/sdk` and `@nestia/migrate` build TypeScript source through
[`@ttsc/factory`](https://www.npmjs.com/package/@ttsc/factory), a
dependency-free, printer-compatible AST factory and printer. Third-party code
generators that previously reached into `@nestia/core` internals should depend
on `@ttsc/factory` directly.

## Native binary requirement

Until prebuilt binaries are distributed through optional npm dependencies, the
local toolchain must have Go available on `PATH`. For deterministic CI builds,
use the Go version declared by `packages/core/native/go.mod`.

## Diagnostics

Compilation failures surface through `ttsc-nestia: ...` stderr. If a generated
runtime path throws `NoTransformConfigurationError`, confirm the project was
compiled by `ttsc` or a bundler wired through `@ttsc/unplugin`.

Set `TTSC_NESTIA_PROFILE=1` before running `ttsc` to print transform cache
counters:

```bash
TTSC_NESTIA_PROFILE=1 ttsc
```

Set `NESTIA_NATIVE_DEBUG_STACK=1` when reproducing a native panic and you need
the Go stack trace in the diagnostic output.
