# 읽기 Ledger

## ttsc 핵심 파일

| 경로 | 확인한 내용 |
| --- | --- |
| `README.md` | `ttsc`, `ttsx`, transformer support, setup command, plugin list |
| `docs/README.md` | JS manifest와 Go backend의 책임 분리, plugin kind, reading order |
| `packages/ttsc/src/TtscCompiler.ts` | `prepare`, `clean`, `compile`, `transform` programmatic API와 in-memory contract |
| `packages/ttsc/src/plugin/internal/loadProjectPlugins.ts` | `compilerOptions.plugins` 로딩, `createTtscPlugin` 우선, `source` 검증, stage 판정 |
| `packages/ttsc/src/plugin/internal/buildSourcePlugin.ts` | source plugin build target, cache key, bundled Go toolchain, `go.work` overlay |
| `packages/ttsc/src/compiler/internal/transformProjectInMemory.ts` | transform stage 실행, check stage 선행, single transform backend 제약 |
| `packages/ttsc/driver/program.go` | Program facade, diagnostics, checker lease, source file filter |
| `packages/ttsc/driver/rewrite.go` | emit-time rewrite, `RewriteSet`, sentinel, output path와 source path 매칭 |
| `packages/ttsc/cmd/ttsc/api_transform.go` | source-to-source JSON API `{ typescript }` |
| `packages/ttsc/cmd/ttsc/build.go` | native build/check/emit path |

## typia 핵심 파일

| 경로 | 확인한 내용 |
| --- | --- |
| `GO-MIGRATION-INSTRUCTION.md` | copy-first, 1:1 mechanical porting, immutable tests, per-file wiki rule |
| `packages/typia/src/transform.ts` | `createTtscPlugin()` manifest, native source resolution |
| `packages/typia/native/cmd/ttsc-typia/main.go` | command dispatcher: build/check/transform/demo/version |
| `packages/typia/native/cmd/ttsc-typia/build.go` | Program load, typia call site rewrite, `--plugins-json`, options regex |
| `packages/typia/native/cmd/ttsc-typia/transform.go` | project/single-file transform, source rewrite map, TS output cleanup |
| `packages/typia/native/adapter/adapter.go` | `ITypiaContext` 구성, native transformer 호출, printer, error handling |
| `packages/typia/native/adapter/visit.go` | signature declaration 기반 typia call site 탐지 |
| `packages/typia/src/executable/TypiaSetupWizard.ts` | `ttsc`와 `@typescript/native-preview` 설치, `ts-patch` 제거 |
| `packages/typia/src/executable/setup/PluginConfigurator.ts` | `typia/lib/transform` 등록과 strict/skipLibCheck 보정 |
| `packages/typia/src/executable/TypiaGenerateWizard.ts` | `TtscCompiler.transform()` 기반 source generation |

## nestia 핵심 파일

| 경로 | 확인한 내용 |
| --- | --- |
| `package.json` | root `prepare: ts-patch install`, `ts-patch` devDependency |
| `packages/core/package.json` | `./lib/transform` export, publishConfig, typia/core/interface/utils 의존 |
| `packages/sdk/package.json` | `./lib/transform`, CLI bin, sdk generator 의존 |
| `packages/cli/src/NestiaSetupWizard.ts` | `ts-patch`, `ts-node`, TypeScript 설치 및 prepare 실행 |
| `packages/cli/src/internal/PluginConfigurator.ts` | core/sdk/typia transformer 등록, decorator metadata 설정 |
| `packages/cli/src/boot.js` | `ts-node.register()`와 plugin list |
| `packages/core/src/transform.ts` | strictNullChecks 검증, `FileTransformer` delegating |
| `packages/core/src/transformers/FileTransformer.ts` | source file visitor, importer 주입, `TransformerError` diagnostic |
| `packages/core/src/transformers/MethodTransformer.ts` | method decorator/return Promise 분석, typed route/websocket transform |
| `packages/core/src/transformers/ParameterDecoratorTransformer.ts` | signature declaration path 기반 Nestia decorator 인식 |
| `packages/core/src/programmers/*.ts` | typia programmers 기반 request/response validator/stringifier plan 생성 |
| `packages/sdk/src/transform.ts` | `SdkOperationTransformer.iterateFile()` export |
| `packages/sdk/src/transformers/SdkOperationTransformer.ts` | controller method에 `OperationMetadata` decorator 주입 |
| `packages/sdk/src/transformers/SdkOperationProgrammer.ts` | typia `MetadataFactory`로 parameter/success/exception schema 생성 |
| `packages/sdk/src/NestiaSdkApplication.ts` | runtime reflection 분석 후 SDK/E2E/Swagger generation |
| `packages/sdk/src/analyses/*.ts` | controller/operation/parameter/response/security/import/path 분석 |
| `packages/sdk/src/generates/*.ts` | generated SDK/Swagger/E2E 파일 작성 |
| `packages/sdk/src/executable/internal/NestiaConfigLoader.ts` | `ts-node`로 config import, sdk transform 자동 추가 |
| `packages/migrate/src/NestiaMigrateApplication.ts` | OpenAPI document를 Nest/SDK 프로젝트 파일로 변환 |

