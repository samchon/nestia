# 2026-05-09 Completion Audit

## 목표 재정의

사용자 요청을 완료 조건으로 바꾸면 다음과 같다.

1. `../ttsc`의 현재 plugin/toolchain contract를 Nestia 계획에 반영한다.
2. `../typia@next`와 `../typia`를 비교해 TypeScript 원본과 Go native 포팅의 대응 원칙을 Nestia 계획에 반영한다.
3. `nestia@next`의 `core`, `sdk`, `cli` 직접 포팅 범위를 파일별로 ledger화한다.
4. Nestia Go migration plan이 requirements -> analyses -> designs -> tests -> implementation 순서로 다음 세션이 그대로 실행할 수 있을 만큼 구체적이어야 한다.
5. 이전 리뷰의 미결정인 single host, typia native 공급, SDK config bridge, package gate, printer/decorator fidelity를 닫는다.
6. 결과는 `.wiki` tree에 한국어 문서로 남긴다.

## Prompt-to-Artifact Checklist

| 요구                                                           | 증거                                                                                                                                                  | 상태                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---- |
| `../ttsc` line-by-line 기준의 live contract 반영               | `.wiki/01-ttsc/00-encyclopedia.md`, `.wiki/01-ttsc/01-execution-model.md`, `.wiki/01-ttsc/02-plugin-protocol.md`                                      | PASS                                                |
| `ttsc` current stage contract                                  | `stage?: "transform"                                                                                                                                  | "check"`로 수정, `"output"` removed stage 거부 명시 | PASS |
| `ttsc` source plugin build/scratch rule                        | `.wiki/01-ttsc/00-encyclopedia.md`, `.wiki/01-ttsc/02-plugin-protocol.md`에서 `node_modules`, `.git`, `.ttsc`, `go.work`, `go.work.sum` 기준으로 수정 | PASS                                                |
| `TtscCompiler.compile()` bridge 오해 제거                      | `.wiki/06-phase0-ledger/04-policy-closures.md` P3에서 materialization bridge로 확정                                                                   | PASS                                                |
| `../typia@next` vs `../typia` 대응                             | `.wiki/00-ledger/01-current-inventory.md`에서 `core/transform` 334개 파일 1:1 대응 확인                                                               | PASS                                                |
| typia native 공급 방식 결정                                    | `.wiki/06-phase0-ledger/04-policy-closures.md` P2에서 vendoring 없이 versioned Go module reuse로 확정                                                 | PASS                                                |
| `nestia@next` core/sdk/cli 파일별 ledger                       | `.wiki/06-phase0-ledger/01-cli-ledger.md`, `02-core-ledger.md`, `03-sdk-ledger.md`                                                                    | PASS                                                |
| file count 검증                                                | `git ls-files ... core/sdk/cli ...` 결과 179개, ledger missing 0개                                                                                    | PASS                                                |
| single transform host 충돌 해결                                | `.wiki/06-phase0-ledger/04-policy-closures.md` P1에서 same source + typia disabled tombstone rule 확정                                                | PASS                                                |
| package/tarball early gate                                     | `.wiki/06-phase0-ledger/04-policy-closures.md` P4, `.wiki/04-strategy/02-phases.md` Phase 2                                                           | PASS                                                |
| printer/decorator fidelity fixture                             | `.wiki/06-phase0-ledger/04-policy-closures.md` P5, `.wiki/04-strategy/03-verification.md`                                                             | PASS                                                |
| requirements -> analyses -> designs -> tests -> implementation | `00-ledger`, `03-nestia`, `04-strategy`, `06-phase0-ledger`가 순서대로 연결됨                                                                         | PASS                                                |
| 기존 NOT READY 사유 보강                                       | `.wiki/05-review/00-verdict.md`, `.wiki/05-review/01-required-corrections.md`에 2026-05-09 보강 상태 반영                                             | PASS                                                |

## Verification Commands

실제 실행한 검증:

```bash
git ls-files 'packages/core/src/*.ts' 'packages/core/src/**/*.ts' \
  'packages/sdk/src/*.ts' 'packages/sdk/src/**/*.ts' \
  'packages/cli/src/*.ts' 'packages/cli/src/**/*.ts' | sort -u | wc -l
# 179

git ls-files 'packages/core/src/*.ts' 'packages/core/src/**/*.ts' \
  'packages/sdk/src/*.ts' 'packages/sdk/src/**/*.ts' \
  'packages/cli/src/*.ts' 'packages/cli/src/**/*.ts' | sort -u | xargs wc -l | tail -n 1
# 15546 total

comm -3 \
  <(git -C ../typia ls-files 'packages/core/src/**' 'packages/transform/src/**' | sed -e 's#packages/core/src/#core/#' -e 's#packages/transform/src/#transform/#' -e 's/\.ts$/.go/' | sort) \
  <(git -C ../typia@next ls-files 'packages/typia/native/core/**' 'packages/typia/native/transform/**' | sed -e 's#packages/typia/native/##' | sort)
# no output
```

ledger coverage check:

```text
{ "files": 179, "missing": [] }
```

## 최종 판정

Phase 0 planning gate는 READY다.

이는 Nestia Go 포팅 구현이 끝났다는 뜻이 아니다. 의미는 다음 세션이 `.wiki/04-strategy/02-phases.md`의 Phase 1부터 구현을 시작해도 되는 수준으로, 참조 toolchain contract와 직접 범위 파일별 ledger, 미결정 정책이 문서상 닫혔다는 뜻이다.

## 2026-05-10 구현 진행 감사

이번 세션에서 Phase 1-3의 1차 구현이 repo에 들어갔다.

완료된 구현:

- `packages/core/native/cmd/ttsc-nestia` 단일 native host를 추가했다.
- `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`은 같은 native source를 반환한다.
- `typia` native snapshot vendoring을 제거하고, `ValidateProgrammer`, `AssertProgrammer`, HTTP/JSON/LLM programmers와 metadata/factory namespace를 `github.com/samchon/typia/packages/typia/native` module에서 직접 import한다.
- `@nestia/core` Go transform은 대표 `TypedRoute`, `TypedBody`, `TypedParam`, `TypedHeaders`, `TypedQuery`, `TypedFormData.Body`, `PlainBody`, `WebSocketRoute` 계열 decorator argument injection을 수행한다.
- `TypedFormData.Body`는 legacy `TypedFormDataBodyProgrammer`의 `Blob`/`File` 단건과 배열 탐지 규칙을 Go metadata 분석으로 옮겨 `files: [{ name, limit }]`를 생성한다.
- `TypedQuery.Get/Post/Patch/Put/Delete` route 계열은 legacy `HttpQuerifyProgrammer` 방향에 맞춰 `input -> URLSearchParams` querify wrapper를 생성한다.
- `WebSocketRoute` method validation은 legacy와 같은 Acceptor 필수 여부, Acceptor 타입, Driver 타입 진단을 Go sidecar에서 수행한다.
- `@nestia/sdk` Go transform은 `OperationMetadata` decorator injection을 수행하며, DTO import graph의 1차 복구, method JSDoc description/tags, `TypedException<T>` generic exception schema를 metadata에 반영한다.
- `sdk` code generation과 swagger generation은 TypeScript에 남겨 두고, `@nestia/factory`를 새로 만들어 `sdk`/`migrate`가 같은 printer-compatible AST node factory를 사용한다. 이 package는 `typescript` runtime import나 compiler API wrapper가 아니다.
- `packages/migrate`는 Go migration하지 않았고, 기존 TypeScript generator만 shared factory import로 바꾸었다.
- `nestia setup`은 `ttsc`, `@typescript/native-preview`를 설치하고, 기존 `ts-patch install` / `typia patch` prepare hook을 제거한다.
- `PluginConfigurator`는 `typia/lib/transform`을 활성 plugin으로 추가하지 않고 `enabled: false` tombstone으로 남겨 `ttsc` package auto-discovery duplicate를 막는다.

검증한 명령:

```bash
pnpm --filter=./packages/* -r build
pnpm --filter nestia run build
cd packages/core/native && go test -count=1 ./...
cd packages/core/test && go test -count=1 ./...
cd packages/sdk/test && go test -count=1 ./...
pnpm --filter @nestia/core run build
pnpm --filter @nestia/sdk run build
pnpm --dir tests/test-sdk start -- --only body
pnpm --dir tests/test-sdk start -- --only query
pnpm --dir tests/test-sdk start -- --only multipart
pnpm --dir tests/test-sdk start -- --only exception
git diff --check
```

추가 smoke:

```bash
go run ./cmd/ttsc-nestia build \
  --cwd /tmp/nestia-native-smoke-* \
  --tsconfig tsconfig.json \
  --plugins-json '[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]' \
  --emit \
  --outDir /tmp/nestia-body-error-json-lib \
  --verbose

node --check /tmp/nestia-body-error-json-lib/controllers/BodyController.js

go run ./cmd/ttsc-nestia build \
  --tsconfig /tmp/nestia-multipart-tsconfig.json \
  --plugins-json '[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]' \
  --emit \
  --outDir /tmp/nestia-multipart-lib \
  --verbose

node --check /tmp/nestia-multipart-lib/controllers/MultipartController.js

go run ./cmd/ttsc-nestia build \
  --tsconfig /tmp/nestia-query-tsconfig.json \
  --plugins-json '[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]' \
  --emit \
  --outDir /tmp/nestia-query-lib \
  --verbose

node --check /tmp/nestia-query-lib/controllers/QueryController.js

go run ./cmd/ttsc-nestia build \
  --tsconfig /tmp/nestia-exception-tsconfig.json \
  --plugins-json '[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform"}},{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]' \
  --emit \
  --outDir /tmp/nestia-exception-lib \
  --verbose

node --check /tmp/nestia-exception-lib/controllers/ExceptionController.js
```

남은 구현 리스크:

- SDK `OperationMetadata`는 native `MetadataFactory` 결과와 1차 import/JSDoc/exception 정보를 담지만, legacy `DtoAnalyzer`의 TypeNode별 generic/name reconstruction은 아직 완전 동등화가 필요하다.
- `strictNullChecks` 관련 legacy diagnostic parity는 별도 fixture 확인이 필요하다.
- `TypedQueryRouteProgrammer`의 LLM parameter validation branch는 아직 Go sidecar에 들어오지 않았다.
- Query route `validate` wrapper는 legacy `HttpValidateQuerifyProgrammer` 흐름을 그대로 포팅했으나, runtime 의미 검증은 별도 e2e로 더 넓혀야 한다.

따라서 현 상태는 "대표 core/sdk native transform + shared factory + package wiring + body/multipart/query/exception 계열 smoke 통과"이며, 전체 Go migration parity 완료는 아니다.

## 2026-05-10 사용자 리뷰 후 수정

수정된 사항:

- `packages/core/native/third_party`를 제거했다.
- `packages/core/native/go.mod`는 typia native Go module pseudo-version을 require하고, typia printer shim만 remote module replacement로 고정한다.
- `packages/core/native/go.work`, `packages/core/test/go.work`, `packages/sdk/test/go.work`는 local 개발에서만 `../ttsc`, `../typia@next`를 replace한다.
- `@nestia/core` package files는 `native` 전체가 아니라 `native/cmd`, `native/plugin`, `native/go.mod`, `native/go.sum`, `native/transform.cjs`만 포함하도록 좁혀 local `go.work`가 tarball에 들어가지 않게 했다.
- `@nestia/factory` 문서와 package metadata를 printer-only AST node factory 계약으로 수정했다.

추가 검증:

```bash
cd packages/core/native && go test ./...
cd packages/core/test && go test -count=1 ./...
cd packages/sdk/test && go test -count=1 ./...
TTSC_CACHE_DIR="$(mktemp -d)" pnpm --dir tests/test-sdk start -- --only query
pnpm --dir packages/core pack --pack-destination "$(mktemp -d)"
```

판정:

- `native/third_party` 복제 방식은 폐기됐다.
- `TTSC_CACHE_DIR`를 비운 `query*` fixture가 통과해 `ttsc` source plugin scratch build가 `go.mod` remote typia module contract로 재빌드됨을 확인했다.
- `@nestia/core` tarball에는 `native/go.mod`, `native/go.sum`, `native/cmd/ttsc-nestia/**`, `native/plugin/**`, `native/transform.cjs`만 포함되고 `native/go.work`와 `native/third_party`는 포함되지 않는다.

## 2026-05-10 TTSC 캐시 실행 정책

문제:

- migrate/sdk 테스트는 fixture별 임시 프로젝트에서 `pnpm ttsc` 또는 `ttsx`를 반복 실행한다.
- `TTSC_CACHE_DIR`가 fixture-local 기본값으로 갈라지거나 `go` executable identity가 generated project의 local dependency 경로로 갈라지면, `ttsc` source plugin cache key가 매번 달라져 Go plugin build가 반복된다.

수정:

- `tests/run-with-ttsc-env.cjs`를 추가했다.
- 모든 test package의 `start` script와 root `pnpm test`는 이 wrapper를 경유한다.
- wrapper는 `TTSC_CACHE_DIR` 기본값을 repo 공용 `node_modules/.ttsc`로 고정한다.
- wrapper는 `TTSC_GO_BINARY` 기본값을 안정적인 Go executable 경로로 고정한다. 현재 검증 환경에서는 `/home/samchon/go-sdk/go/bin/go`다.
- wrapper는 Node 24 TypeScript strip/detect warning 회피 옵션도 한 곳에서 주입한다.

검증:

```bash
node tests/run-with-ttsc-env.cjs node -e "console.log(process.env.TTSC_CACHE_DIR); console.log(process.env.TTSC_GO_BINARY); console.log(process.env.NODE_OPTIONS)"
# /home/samchon/github/samchon/nestia@next/node_modules/.ttsc
# /home/samchon/go-sdk/go/bin/go
# --no-experimental-strip-types --no-experimental-detect-module

time pnpm --dir tests/test-migrate start -- --only damoa
# cold shared cache:
# damoa-nest-keyword: 106,960 ms
# damoa-nest-positional: 47,891 ms
# damoa-sdk-keyword: 5,553 ms
# damoa-sdk-positional: 5,477 ms
# real 2m52.688s

time pnpm --dir tests/test-migrate start -- --only damoa
# warm shared cache:
# damoa-nest-keyword: 50,788 ms
# damoa-nest-positional: 50,717 ms
# damoa-sdk-keyword: 6,421 ms
# damoa-sdk-positional: 5,661 ms
# real 1m57.579s
```

비교 기준:

- wrapper 도입 전 같은 `damoa` fixture는 `119,810 ms`, `156,673 ms`, `44,765 ms`, `46,608 ms`였다.
- 따라서 `damoa` 전체 wall time은 약 6분 8초 수준에서 warm shared cache 기준 약 1분 58초로 내려갔다.

## 2026-05-11 현재 완료성 감사

질문:

- 모든 migration이 완료되었는가?
- 종래의 모든 기능이 정상 동작한다고 보아도 되는가?

판정:

- **NO. 아직 정식 PR/배포 완료 상태가 아니다.**
- local patched `../typia@next`를 강제로 물린 개발 검증에서는 핵심 SDK `app*` fixture가 통과했다.
- 그러나 `packages/core/native/go.mod`가 가리키는 원격 `github.com/samchon/typia/packages/typia/native@v0.0.0-20260510131441-ab7b72500dd0`에는 JSDoc comment tag 적용 누락이 남아 있다.
- 따라서 Nestia 단독 변경만으로는 `@type uint` 같은 legacy JSDoc constraint parity가 보장되지 않는다.

확인된 blocker:

1. `typia/native` remote pseudo-version의 `core/factories/internal/metadata/iterate_metadata_comment_tags.go`는 object property `JsDocTags`를 `MetadataSchema` tag matrix로 적용하지 않는다.
2. 그 결과 `typia.random<IPage.IRequest>()`가 `page=null`, `limit=<float>` 같은 값을 생성할 수 있고, Nestia SDK app fixture가 런타임에서 실패한다.
3. local `../typia@next`에는 다음 보정이 필요했다.
   - `MetadataHelper.go`: `@type` tag의 `TypeExpression` 텍스트를 JSDoc text로 수집한다.
   - `iterate_metadata_comment_tags.go`: known JSDoc tags만 value 검증하고, property `JsDocTags`를 number/string/array tag matrix에 반영한다.
4. `ttsc` source plugin cache key는 `GOFLAGS=-modfile=...` 같은 외부 modfile replacement를 cache key에 포함하지 않는다. local 검증 때 만든 patched typia plugin binary가 기본 remote 검증을 오염시킬 수 있으므로, 검증 전후 `node_modules/.ttsc/plugins` 정리가 필요하다.

Nestia 쪽에서 추가로 수정한 사항:

- `packages/sdk/src/executable/internal/NestiaConfigLoader.ts`
  - `ts-node/register` 기반 config import 대신 `TtscCompiler.compile()`로 `nestia.config.ts`를 materialize한다.
  - `input: () => new Backend().application.get()` 형태의 config도 `@nestia/sdk` native transform이 적용된 controller metadata를 보게 했다.
  - config materialization wrapper에 Node ambient types를 명시적으로 주입해 `NodeJS.*`와 `process.*` 사용 fixture를 통과시켰다.
- `tests/test-sdk/features/app/src/test/features/test_bootstrap.ts`
  - top-level `app.listen()`을 제거하고, `test_bootstrap()` 함수 안에서 Swagger document를 구성한 뒤 `app.close()`로 종료한다.
- `tests/run-with-ttsc-env.cjs`
  - shared `TTSC_CACHE_DIR`와 stable `TTSC_GO_BINARY`는 유지한다.
  - Rollup ESM config를 깨던 `--no-experimental-detect-module` 주입은 제거했다.

검증 결과:

```bash
cd ../typia@next/packages/typia/native
go test ./core/factories/internal/metadata ./core/factories ./core/programmers/iterate
# PASS

# local patched typia/ttsc를 GOFLAGS=-modfile로 강제한 상태
pnpm --dir tests/test-sdk start -- --only app-globalPrefix-versionUri
# app-globalPrefix-versionUri: 13,722 ms
# app-globalPrefix-versionUri-routerModule: 15,618 ms
# Total Elapsed Time: 29,358 ms

# 같은 local patched native plugin cache를 사용한 상태
pnpm --dir tests/test-sdk start -- --only app
# app: 13,603 ms
# app-globalPrefix: 11,595 ms
# app-globalPrefix-versionUri: 14,574 ms
# app-globalPrefix-versionUri-routerModule: 13,589 ms
# app-routerModule: 15,505 ms
# app-versionHeader: 11,726 ms
# app-versionUri: 14,141 ms
# Total Elapsed Time: 94,749 ms

pnpm --filter @nestia/sdk run build
# PASS
```

완료 조건:

1. `../typia@next`의 JSDoc tag fix가 typia `next` branch에 반영되어 새 Go pseudo-version을 얻어야 한다.
2. `packages/core/native/go.mod`와 `go.sum`이 그 새 pseudo-version을 가리켜야 한다.
3. `node_modules/.ttsc/plugins`와 fixture-local `node_modules/.cache/ttsc`를 비운 default remote-module 상태에서 generated e2e random code가 `@type uint` constraints를 포함해야 한다.
4. 이후 `tests/test-sdk`, `tests/test-migrate`, package build, Go unit tests를 다시 full gate로 돌려야 한다.

추가 확인:

```bash
rm -rf node_modules/.ttsc/plugins \
  tests/test-sdk/features/app-globalPrefix-versionUri/node_modules/.cache \
  tests/test-sdk/features/app-globalPrefix-versionUri-routerModule/node_modules/.cache
pnpm --dir tests/test-sdk start -- --only app-globalPrefix-versionUri
# PASS가 나올 수 있음. 그러나 이는 random input이 우연히 안전한 값으로 뽑힌 smoke 결과다.

find tests/test-sdk/features/app-globalPrefix-versionUri/node_modules/.cache/ttsc/ttsx/project \
  -name '*v2_bbs_articles_index.js' -print -exec sed -n '1,90p' {} \;
# page/limit random code가 여전히 undefined | null | randomNumber({ type: "number" }) 형태다.
# Type<"uint32">, Math.floor, minimum: 0 constraint가 없다.
```

따라서 2026-05-11 현재 상태는 **local patched dependency 기준 app SDK parity 일부 회복**, **release dependency 기준 NOT COMPLETE**다.
- 첫 cold run에서 한 번 찍히는 `ttsc: building source plugin "@nestia/core"`는 새 cache key 최초 build라 정상이다. 같은 cache key의 반복 실행에서는 해당 출력이 사라진다.

## 2026-05-11 추가 parity 감사: `all` fixture

`app*` fixture 통과 뒤 전체 완료로 판정하지 않은 이유가 추가로 확인됐다.

확인된 문제:

- `tests/test-sdk/features/all`의 `@core.TypedBody()` validator와 generated e2e `typia.assert<IBbsArticle>()`가 `@format uri`, `@format uuid`, `@format date-time` 검사를 생성한다.
- local patched `../typia@next`에서도 JSDoc `@format` tag의 validate script가 `_isFormatUri($input)`처럼 raw helper명을 직접 사용했다.
- 이 경우 `ExpressionFactory.Transpile()`의 `$importInternal(...)` 경로를 타지 않아 emitted JS에 `typia/lib/internal/_isFormat*` import가 빠졌다.
- 실제 실패는 `/all` POST가 500을 반환하는 형태였고, generated controller에는 `_isFormatUri(input.url)` 참조만 있고 import가 없었다.

수정:

- `../typia@next/packages/typia/native/core/factories/internal/metadata/iterate_metadata_comment_tags.go`
  - `@format uuid/email/url/uri/ipv4/ipv6/date/date-time` validate script를 `$importInternal("_isFormatX")($input)` 형식으로 변경했다.
  - `datetime`/`dateTime` fallback은 기존 `new Date(...).getTime()` script를 유지했다.

검증:

```bash
cd ../typia@next/packages/typia/native
gofmt -w core/factories/internal/metadata/iterate_metadata_comment_tags.go
go test ./core/factories/internal/metadata ./core/factories ./core/programmers/iterate ./core/programmers
# PASS

# stable local modfile/wrapper로 ../typia@next, ../ttsc, shim modules를 replace한 상태
TTSC_GO_BINARY="$PWD/node_modules/.ttsc-local-patched/go-wrapper" \
TTSC_CACHE_DIR="$PWD/node_modules/.ttsc-local-patched" \
pnpm --dir tests/test-sdk start -- --only all
# all: 23,186 ms
# Total Elapsed Time: 23,202 ms
```

생성물 확인:

```text
tests/test-sdk/features/all/.../AllController.js
const { _isFormatUri: __typia_transform__isFormatUri } = require("typia/lib/internal/_isFormatUri");
...
__typia_transform__isFormatUri(input.url)

tests/test-sdk/features/all/.../test_api_all_store.js
const { _isFormatDateTime: __typia_transform__isFormatDateTime } = require("typia/lib/internal/_isFormatDateTime");
const { _isFormatUri: __typia_transform__isFormatUri } = require("typia/lib/internal/_isFormatUri");
const { _isFormatUuid: __typia_transform__isFormatUuid } = require("typia/lib/internal/_isFormatUuid");
```

판정:

- local patched dependency 기준으로 `all` fixture의 format-helper import 누락은 해소됐다.
- 그러나 이 역시 `../typia@next` 미출시 보정에 의존한다.
- `packages/core/native/go.mod`의 remote typia pseudo-version이 새 fix를 가리키기 전에는 release dependency 기준 완료가 아니다.
