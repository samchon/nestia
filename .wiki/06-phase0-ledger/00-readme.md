# Phase 0 Ledger

이 디렉터리는 2026-05-09 현재 `feat/go` branch의 `packages/core/src`, `packages/sdk/src`, `packages/cli/src`를 기준으로 작성한 파일별 Go 포팅 ledger다.

검증한 범위:

| 범위 | 파일 | 라인 | 성격 |
| --- | ---: | ---: | --- |
| `packages/core/src` | 73 | 5,526 | runtime decorator surface + `@nestia/core/lib/transform` |
| `packages/sdk/src` | 97 | 9,418 | SDK/Swagger generator + `@nestia/sdk/lib/transform` |
| `packages/cli/src` | 9 | 602 | setup wizard와 tsconfig plugin mutation |
| 합계 | 179 | 15,546 | Phase 0 직접 범위 |

## 판정 용어

| 판정 | 의미 | 구현 기준 |
| --- | --- | --- |
| `native-port` | Go sidecar로 실제 이전해야 하는 compiler transformer/programmer | `packages/core/native/**` 또는 `packages/sdk/native/**`에 1:1 대응 파일을 둔다. |
| `manifest/legacy-transform` | 현재 JS transformer entry이자 미래 `createTtscPlugin()` manifest 자리 | legacy transformer는 transition path로 격리하고 default는 native manifest로 돌린다. |
| `native-shadow-contract` | TS public option/DTO는 유지하되 native payload parser에도 같은 구조가 필요함 | Go struct를 추가하고 `--plugins-json` normalization test를 둔다. |
| `config-bridge` | `ts-node.register({ plugins })`를 대체할 SDK config 실행 경로 | `TtscCompiler.compile()` output materialization을 1차 방식으로 채택한다. |
| `setup-bridge` | `nestia setup`의 package install/tsconfig mutation 경로 | `ts-patch`가 아니라 `ttsc`, `@typescript/native-preview`, disabled typia tombstone을 다룬다. |
| `generator-keep-ts` | 파일 생성기는 TS runtime으로 유지 | native transform의 source map contract에 섞지 않는다. |
| `runtime-keep-ts` | NestJS runtime decorator/helper | native output과 runtime behavior parity만 검증한다. |
| `dto-keep-ts` | public/runtime TypeScript DTO | native analyzer가 읽을 shadow type만 추가한다. |
| `analysis-compiler-api` | SDK 분석기 중 `TypeChecker`, `Type`, `SourceFile` 등에 닿는 파일 | config bridge 이후 Go 이전 여부를 다시 판단한다. |

## 읽기 근거

ledger는 `git ls-files`로 범위를 고정하고, 각 파일을 TypeScript AST로 열어 export, import, `ts.*` 사용, typia/core 의존점, diagnostics 흔적을 추출한 뒤 수작업으로 포팅 판정을 붙였다.

이전 리뷰의 `180개` 표기는 `git` pathspec과 branch drift가 섞인 오래된 숫자다. 현재 branch의 직접 범위는 `src/*.ts`와 `src/**/*.ts`를 합쳐 179개다.

## 완료 기준

Phase 0은 다음 조건을 만족해야 닫힌다.

1. 179개 파일이 누락 없이 ledger에 등장한다.
2. native 이전 대상과 TS 유지 대상이 분리되어 있다.
3. `ttsc` 현재 contract와 맞지 않는 `output` stage, scratch copy 제외 규칙, old line count가 수정되어 있다.
4. single host, typia native 공급, SDK config bridge, early package gate, printer/decorator fidelity가 닫힌 정책으로 문서화되어 있다.

