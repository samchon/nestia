# Phase 0 정책 결정

이 문서는 2026-05-04 리뷰에서 `P1`-`P5`로 남긴 미결정을 닫는다. 여기의 결정은 다음 구현 세션에서 변경 없이 따를 기본값이다.

## P1. Single Host 정책

결정: Nestia는 `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`이 같은 native source를 반환하는 단일 backend를 사용한다.

권장 source:

```text
@nestia/core package root
  native/cmd/ttsc-nestia
```

`@nestia/sdk/lib/transform`은 `require.resolve("@nestia/core/package.json", { paths: [context.projectRoot] })`로 core package root를 찾고 같은 `native/cmd/ttsc-nestia`를 반환한다.

사용자 project에 `typia`가 direct dependency로 있으면 `ttsc`의 package auto-discovery가 `typia/package.json#ttsc.plugin`을 자동 추가할 수 있다. 이때 typia와 nestia가 서로 다른 native binary를 반환하면 `ttsc: multiple transform native backends cannot share one source-to-source pass`에 걸린다.

따라서 `nestia setup`은 다음 migration rule을 따른다.

1. 기존 `{ "transform": "typia/lib/transform", ...options }` entry가 있으면 `functional`, `numeric`, `finite`, `undefined` 옵션을 `@nestia/core/lib/transform` entry의 `typia` sub-config로 복사한다.
2. 기존 typia entry는 `{ "transform": "typia/lib/transform", "enabled": false }` tombstone으로 남긴다.
3. `ttsc` loader는 disabled explicit entry를 최종 실행에서 제외하지만, configured transform set에는 남겨 package auto-discovery의 typia duplicate를 막는다.
4. `ttsc-nestia`는 `--plugins-json`에서 `@nestia/core`, `@nestia/sdk` config를 읽고, core config 안의 `typia` sub-config로 typia native transformer를 호출한다.

이 정책은 current `ttsc` loader의 동작에 맞춘다. `ttsc`가 나중에 aggregate plugin replacement API를 제공하면 tombstone rule은 제거 가능하지만, 지금은 이 rule이 가장 안전하다.

## P2. typia Native 공급 방식

결정: Nestia는 typia native source를 vendoring하지 않는다. `packages/core/native/go.mod`는 typia native Go module을 versioned dependency로 require하고, local 개발에서는 `packages/core/native/go.work`만 `../typia@next/packages/typia/native`로 replace한다.

근거:

- typia Go migration은 이미 `github.com/samchon/typia/packages/typia/native` module로 완결되어 있다.
- Nestia가 필요한 것은 `adapter`, `core/context`, `core/factories`, `core/programmers`, `core/programmers/http|json|llm|misc`, `core/schemas/metadata` namespace 일부다.
- full source snapshot을 Nestia에 복사하면 typia programmer bugfix와 metadata shape 변경을 다시 추적해야 한다.
- `ttsc` source plugin build는 installed `ttsc` module과 shim overlay를 자동으로 붙인다. Nestia는 typia printer shim만 명시적으로 typia module version에 맞춘다.

구현 형태:

```text
packages/core/native/
  go.mod        # release contract: remote typia native module
  go.work       # local contract: ../ttsc, ../typia@next replace only
  cmd/ttsc-nestia/**
```

`go.mod` 기준:

```go
require github.com/samchon/typia/packages/typia/native v0.0.0-20260510131441-ab7b72500dd0
replace github.com/microsoft/typescript-go/shim/printer => github.com/samchon/typia/packages/typia/native/shim/printer v0.0.0-20260510131441-ab7b72500dd0
```

`go.work`는 source plugin build의 scratch copy에서 제외되므로 배포 계약이 아니다. repo-local test에서만 현재 checkout의 `../ttsc`와 `../typia@next`를 강제로 사용한다.

## P3. SDK Config Execution Bridge

결정: 1차 bridge는 `TtscCompiler.compile()` output materialization이다.

`TtscCompiler.compile()`은 in-memory `{ output }` record를 반환한다. 그 자체로 `import()` 가능한 module graph가 아니므로 SDK CLI는 다음 helper를 둔다.

```text
packages/sdk/src/executable/internal/TtscConfigMaterializer.ts
```

책임:

1. `NestiaConfigLoader.compilerOptions(project)`로 config root와 parsed options를 얻는다.
2. `new TtscCompiler({ cwd, tsconfig, plugins }).compile()`을 실행한다.
3. 성공 result의 `output` record를 temp directory에 materialize한다.
4. config file의 emitted JS path를 찾아 `pathToFileURL(...).href`로 import한다.
5. temp directory에 nearest `node_modules` symlink 또는 require path bridge를 둔다.
6. import 완료 후 temp directory cleanup을 수행한다. watch/dev mode가 필요해질 때만 cache 유지 옵션을 추가한다.

`ttsx` bridge library화는 2차 선택지다. 현재 plan에서는 구현 표면을 줄이기 위해 채택하지 않는다.

## P4. Early Package Gate

결정: package/tarball gate는 Phase 2 native skeleton 완료 조건이다. Phase 7 publish 단계까지 미루지 않는다.

필수 smoke:

```bash
pnpm --filter=./packages/core build
pnpm --filter=./packages/sdk build
pnpm --filter=./packages/cli build
pnpm package:tgz
```

tarball inspection:

- `@nestia/core` tarball에 `native/cmd/ttsc-nestia`, `native/go.mod`가 포함된다.
- `@nestia/core` tarball에 `native/third_party`가 포함되지 않는다.
- `@nestia/core` tarball에 local 개발 전용 `native/go.work`가 포함되지 않는다.
- `@nestia/core/lib/transform.js`와 `@nestia/core/lib/transform.d.ts`가 built output으로 존재한다.
- `@nestia/sdk/lib/transform.js`가 `@nestia/core` package root를 기준으로 같은 native source를 resolve한다.
- clean fixture에서 `npx ttsc prepare`가 native source plugin을 build한다.
- clean fixture에서 `npx ttsc --noEmit`이 multiple backend error 없이 통과한다.

## P5. Printer/Decorator Fidelity

결정: source transform fixture를 Phase 3부터 고정한다.

필수 fixture:

| Fixture | 검증 |
| --- | --- |
| method decorator argument 추가 | `@TypedRoute.Get()`가 기존 decorator order를 유지하며 argument를 받는다. |
| parameter decorator argument 추가 | `@TypedBody()`와 `@TypedParam("id")`가 validator expression을 받는다. |
| `OperationMetadata` decorator 추가 | 기존 decorators 뒤/앞 위치가 legacy transformer와 일치한다. |
| directive/import 삽입 | `"use strict"`나 shebang 뒤 삽입 위치가 깨지지 않는다. |
| JSDoc 보존 | controller/method JSDoc tags와 description이 SDK metadata에 보존된다. |
| path 형태 | published d.ts path, pnpm symlink path, monorepo source path가 모두 source file matching에 성공한다. |
| combined typia/nestia | 같은 파일의 일반 `typia.*<T>()` call과 Nestia decorator가 같은 native pass에서 처리된다. |

비교 대상은 세 개다.

1. legacy `ts-patch` transformer output
2. `ttsc-nestia transform --output ts`
3. `ttsc-nestia build --emit` JS output
