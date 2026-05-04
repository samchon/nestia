# Migration Phases

## Phase 0. Ledger 완성

목표:

- Nestia source file별 wiki 생성
- core/sdk/cli/migrate package별 포팅 대상 분류
- TypeScript compiler API 사용 지점 전수 목록화

완료 기준:

- `packages/core/src/**/*.ts` 전체 문서화
- `packages/sdk/src/**/*.ts` 전체 문서화
- `packages/cli/src/**/*.ts` 전체 문서화
- `ts-patch`/`ts-node` 의존 경로 전부 표시

## Phase 1. ttsc manifest transition

목표:

- `core/sdk/typia` single-host 공존 정책 결정
- `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`에 legacy-compatible `createTtscPlugin()` 추가
- package root/source resolution smoke test 작성
- setup wizard 전환은 아직 하지 않는다. native skeleton, tarball inclusion, `ttsc prepare` smoke가 끝나기 전에는 consumer setup을 바꾸지 않는다.

검증:

```bash
pnpm --filter=./packages/core build
pnpm --filter=./packages/sdk build
pnpm --filter=./packages/cli build
```

## Phase 2. native skeleton

목표:

- `ttsc-nestia` command skeleton 작성
- `build`, `check`, `transform`, `version`, `help` 구현
- Program load와 diagnostics 출력만 먼저 연결
- `--plugins-json` parser 작성
- `native/**` package inclusion과 clean fixture `ttsc prepare` smoke 검증

검증:

```bash
npx ttsc prepare
npx ttsc --noEmit
pnpm package:tgz
```

## Phase 3. SDK OperationMetadata native transform

목표:

- `SdkOperationTransformer`
- `SdkOperationProgrammer`
- `IOperationMetadata` literal generation
- `OperationMetadata` import/decorator injection
- 최소 config execution harness. `TtscCompiler.compile()` output은 in-memory이므로 import 가능한 temp directory로 materialize하거나, `ttsx` execution bridge를 library화하는 방식 중 하나를 검증용으로 선택한다.

검증:

- controller method fixture source transform 비교
- runtime `Reflect.getMetadata("nestia/OperationMetadata", ...)` 확인
- SDK generator route count 확인

## Phase 4. Core decorator native transform

목표:

- `FileTransformer`
- `NodeTransformer`
- `MethodTransformer`
- `ParameterTransformer`
- `ParameterDecoratorTransformer`
- `TypedRouteTransformer`
- `WebSocketRouteTransformer`
- `programmers/**`

검증:

- body/header/query/param decorator fixtures
- `TypedRoute` response stringify mode fixtures
- `EncryptedRoute`
- `TypedQueryRoute`
- `WebSocketRoute`
- diagnostics fixtures

## Phase 5. typia rewrite integration

목표:

- user source의 typia call rewrite와 Nestia rewrite를 같은 native transform host에서 처리
- typia plugin options 보존
- import cleanup 충돌 제거

검증:

- Nestia decorator와 일반 typia call이 같은 file에 있는 fixture
- `typia/lib/transform` entry가 있거나 없을 때 behavior 정의
- multiple transform backend 충돌 없음

## Phase 6. SDK config execution bridge

목표:

- `NestiaConfigLoader`에서 `ts-node` 제거
- `TtscCompiler.compile()` output materialization 또는 `ttsx` bridge로 config/controller 실행
- temp output/cache lifecycle 관리

검증:

- `nestia sdk`
- `nestia swagger`
- `nestia e2e`
- path alias/baseUrl config
- Nest application input function config

## Phase 7. package contract and publish

목표:

- package `files`에 native source 포함
- publishConfig exports 정리
- setup docs 수정
- `ts-patch` dependency 제거
- CI가 ttsc path를 사용
- migrate template assets에서 legacy `ts-patch`, `ts-node`, 기존 transformer setup을 compatibility scope로 점검

검증:

```bash
pnpm build
pnpm test
pnpm package:tgz
```

tarball에서 native source, transform manifest, CLI bin, assets를 직접 확인한다.
