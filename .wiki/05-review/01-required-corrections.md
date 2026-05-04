# 필수 보강 항목

## P0. 파일별 Ledger

현재 Phase 0 완료 기준을 만족하지 못한다.

필수 생성 대상:

- `packages/core/src/**/*.ts`
- `packages/sdk/src/**/*.ts`
- `packages/cli/src/**/*.ts`

현재 합계는 180개 source file이다.

각 파일별 문서에는 다음을 포함한다.

- 원본 경로
- native 대응 경로
- exported identifiers
- 내부 알고리즘
- TypeScript compiler API 사용 지점
- TypeScript-Go shim 대응
- typia native API 의존점
- diagnostics behavior
- status

## P1. Single Host 정책

결정해야 할 질문:

- 기존 `typia/lib/transform` entry를 Nestia setup에서 제거/치환할 것인가?
- typia와 shared backend manifest를 합의할 것인가?
- 기존 사용자 tsconfig에 이미 있는 typia/core/sdk 3개 entry는 migration 시 어떻게 정리할 것인가?

이 결정 없이 manifest만 바꾸면 `ttsc` transform backend 충돌이 난다.

## P2. typia Native 공급 방식

결정해야 할 질문:

- Nestia native module이 `github.com/samchon/typia/packages/typia/native`를 직접 require할 것인가?
- npm dependency의 Go source를 `ttsc` scratch build에 어떻게 공급할 것인가?
- typia native source를 tested snapshot으로 vendoring할 것인가?
- `ttsc` overlay/replacement를 확장할 것인가?

## P3. SDK Config Execution Bridge

`TtscCompiler.compile()`은 output을 in-memory record로 반환한다. 따라서 config import bridge는 다음 중 하나를 선택해야 한다.

- compile output을 temp directory에 materialize하고 compiled config module을 import한다.
- `ttsx` execution bridge를 library화한다.

`ts-node.register({ plugins })`는 native transform 실행 경로가 아니므로 제거 대상이다.

## P4. Early Package Gate

초기 phase에서 검증해야 한다.

- `native/**`가 tarball에 포함되는가?
- `createTtscPlugin()`의 `source`가 clean install에서 resolve되는가?
- `npx ttsc prepare`가 clean fixture에서 성공하는가?
- `@nestia/sdk/lib/transform`이 core native source를 참조한다면 `@nestia/core/package.json` 기준 resolution이 동작하는가?

## P5. Printer/Decorator Fidelity

필수 fixture:

- method decorator argument 추가
- parameter decorator argument 추가
- `OperationMetadata` decorator 추가
- existing decorator order 보존
- `use strict`/directive 뒤 import 삽입
- JSDoc tag/description 보존
- published d.ts path, pnpm symlink path, monorepo source path

