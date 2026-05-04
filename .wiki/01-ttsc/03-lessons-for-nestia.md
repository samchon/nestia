# ttsc에서 Nestia가 배워야 할 점

## 1. JS transformer 함수에서 native manifest로 전환

현재 `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`은 TypeScript transformer function을 export한다. `ttsc`에서 필요한 것은 function transformer가 아니라 `createTtscPlugin()` manifest다.

전환 방식은 `typia@next/packages/typia/src/transform.ts`를 따라야 한다.

- package root resolve
- native command source resolve
- `{ name, source }` 반환
- 기존 ts-patch 호환 export는 transition 동안만 유지

## 2. ts-node 실행 경로 제거

`packages/sdk/src/executable/internal/NestiaConfigLoader.ts`는 `ts-node.register()`로 config를 load한다. 이 방식은 `ttsc` native plugin을 실행하지 못한다.

필요한 전환:

- config/project를 `TtscCompiler.compile()`로 임시 output에 compile
- 또는 `ttsx` execution을 library화해서 config import
- compile cache와 generated temp output을 명시적으로 관리
- `@nestia/sdk/lib/transform` 자동 추가도 `plugins` 배열 조작이 아니라 ttsc plugin payload에 반영

## 3. 하나의 transform host 설계

Nestia는 typia에 깊게 의존한다. `@nestia/core` transformer는 typia `AssertProgrammer`, `IsProgrammer`, `ValidateProgrammer`, `JsonStringifyProgrammer`, `HttpQueryProgrammer` 등을 호출한다. `@nestia/sdk` transformer도 typia `MetadataFactory`와 `MetadataCollection`을 사용한다.

따라서 Nestia native backend는 typia native core를 단순 dependency로 쓰는 수준을 넘어 user source 안의 typia call rewrite와 Nestia decorator rewrite를 같은 transform pass에서 조율해야 한다.

## 4. 변환과 생성의 표면을 나누기

Nestia에는 두 종류의 compile-time work가 섞여 있다.

- source transform: decorator argument와 OperationMetadata decorator 주입
- project generation: SDK/Swagger/E2E file generation

`ttsc.transform()`은 source map을 돌려주는 API이고, SDK 파일 생성은 filesystem writer다. 둘을 한 command에 섞으면 API surface가 흐려진다.

권장 분리:

- `ttsc-nestia transform`: source-to-source transform
- `ttsc-nestia build/check`: compile path
- `nestia sdk`: config 실행과 generated file write
- internal bridge: SDK CLI가 `TtscCompiler.compile()`로 config/controller metadata를 준비

## 5. output hard-coding 금지

`ttsc`와 `typia@next`의 공통 철학은 일반 알고리즘이다. Nestia도 특정 controller 이름, DTO 이름, 테스트 fixture 이름에 의존하는 예외 처리를 넣으면 안 된다.

모든 처리는 다음 근거 중 하나로 결정해야 한다.

- TypeScript-Go AST kind
- TypeChecker symbol/signature/declaration
- NestJS reflect metadata key
- Nestia decorator declaration path
- typia metadata/schema validation result

