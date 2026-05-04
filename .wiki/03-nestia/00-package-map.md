# nestia@next Package Map

## root

현재 root `package.json`은 다음 compiler patch 모델을 가진다.

- `scripts.prepare = "ts-patch install"`
- devDependency `ts-patch`
- devDependency `typescript`

Go 포팅에서는 root prepare가 없어지거나 `ttsc prepare` 성격으로 바뀌어야 한다. consumer package에 `ts-patch install`을 강제하지 않는다.

## packages/core

`@nestia/core`는 NestJS decorator와 runtime validator/stringifier wrapper, 그리고 compiler transformer를 제공한다.

중요 export:

- `.`
- `./lib/transform`
- `./src/transform.ts`

중요 source:

- `decorators/**`: public decorator와 runtime helper
- `programmers/**`: typia 기반 validator/stringifier plan 생성
- `transformers/**`: AST transformer
- `options/**`: transform option contract

## packages/sdk

`@nestia/sdk`는 SDK/Swagger/E2E generator와 compile-time metadata transformer를 제공한다.

중요 export:

- `.`
- `./lib/executable/sdk`
- `./lib/transform`

중요 source:

- `transformers/**`: controller method에 `OperationMetadata` decorator 주입
- `analyses/**`: runtime reflection 결과를 typed route로 분석
- `generates/**`: SDK/Swagger/E2E output 작성
- `executable/**`: CLI command/config loader

## packages/cli

`nestia` CLI는 setup wizard를 제공한다.

현재 역할:

- Nestia/typia/ts-patch/ts-node/typescript 설치
- `ts-patch install` prepare script 구성
- core/sdk/typia transformer tsconfig 등록

Go 포팅 후 역할:

- Nestia/typia/ttsc/@typescript/native-preview 설치
- `ts-patch` 제거
- 통합 native transform plugin 등록
- `ttsc`/`ttsx` 실행 안내

## packages/migrate

`@nestia/migrate`는 OpenAPI document를 Nest/SDK project file set으로 변환한다. compiler transformer와 직접 연결된 핵심 경로는 아니다. typia runtime validation과 `@typia/utils` migration utilities에 의존한다.

Go 포팅 1차 범위에서는 `migrate` 자체 재작성보다 typia@next runtime compatibility와 package contract 확인이 우선이다.

