# Nestia Go 포팅 Master Plan

## 목표

Nestia의 Go 포팅 목표는 Nestia를 Go application framework로 바꾸는 것이 아니다. 목표는 TypeScript/NestJS 사용자 경험을 유지하면서 compiler-powered 부분을 `ttsc` native sidecar로 이전하는 것이다.

보존할 사용자 경험:

- `@nestia/core` decorators
- `@nestia/sdk` generator
- `nestia setup`
- generated SDK output
- typia 기반 validator/stringifier 성능/정확성
- NestJS runtime compatibility

바꿀 내부 구조:

- `ts-patch` transformer hook 제거
- `ts-node` plugin execution 제거
- TypeScript transformer 구현을 Go native backend로 이전
- typia/core/sdk transform을 single native transform host에서 처리

## 제1 원칙

Nestia native backend는 `ttsc`의 plugin contract 안에 있어야 한다.

따라서 다음은 금지다.

- `ts-patch`를 남겨 둔 채 Go 구현을 우회 호출
- JS transformer hook으로 TypeScript AST를 계속 조작
- typia와 nestia가 서로 다른 transform native binary를 반환
- SDK CLI에서 `ts-node` plugin 옵션을 계속 신뢰

## 권장 전체 그림

```text
consumer tsconfig
  compilerOptions.plugins
    - @nestia/core/lib/transform
    - @nestia/sdk/lib/transform
    - typia/lib/transform

ttsc JS host
  load plugins
  build one native source backend
  pass ordered --plugins-json

ttsc-nestia native backend
  load Program / Checker
  read plugin payload
  collect typia call sites
  collect nestia decorators
  collect sdk controller metadata sites
  produce source transform JSON or emit rewrites
```

현실적으로 `typia/lib/transform`이 별도 binary를 반환하면 충돌한다. 그러므로 Nestia setup은 통합 backend 전략을 Phase 0/1에서 먼저 결정해야 한다. 이 결정을 Phase 5까지 미루면 기존 setup이 등록하는 `typia/lib/transform`, `@nestia/core/lib/transform`, `@nestia/sdk/lib/transform` 세 entry가 즉시 충돌할 수 있다.

가장 안전한 설계는 `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`이 같은 `ttsc-nestia` source를 반환하고, Nestia backend가 typia native transformer를 내부 dependency로 호출하는 것이다. user project의 일반 `typia.*<T>()` call까지 처리하려면 setup 단계에서 `typia/lib/transform`을 별도로 넣지 않거나, typia와 합의한 shared backend manifest를 사용해야 한다.

## 포팅 우선순위

1. `core/sdk/typia` single-host 공존 정책 결정
2. legacy-compatible manifest와 package source resolution smoke
3. native transform skeleton
4. package/tarball native source inclusion gate
5. SDK OperationMetadata transformer와 최소 config execution harness
6. core decorator transformer
7. typia call rewrite 통합
8. SDK config compile/import bridge 정식화
9. generator parity tests
10. setup/migration UX
11. migrate package 검토

SDK OperationMetadata를 core decorator보다 먼저 잡는 이유는 output이 metadata literal decorator로 국한되어 있어 parity 검증이 쉽기 때문이다. core decorator는 typia programmers와 import injection, runtime helper alias가 얽혀 있어 난도가 높다.
