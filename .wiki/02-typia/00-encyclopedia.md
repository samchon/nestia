# typia 백과: TS 원본과 Go 포트

`typia`는 TypeScript type을 분석해 runtime validator, serializer, random generator, schema, LLM parameter 등을 생성하는 compiler-powered library다.

`typia@next`는 이 중 compiler 핵심인 다음 두 tree를 Go로 옮겼다.

- `../typia/packages/core/src`
- `../typia/packages/transform/src`

현재 대응 tree:

- `packages/typia/native/core`
- `packages/typia/native/transform`

파일 경로 대응은 1:1이다. 원본 `.ts` 경로를 native `.go` 경로로 바꿨을 때 차이가 없다.

## Go 포팅의 핵심 철학

`GO-MIGRATION-INSTRUCTION.md`의 핵심은 다음이다.

- TS 원본을 먼저 native tree에 bulk-copy한다.
- `.ts`는 아직 대기 중인 원본이고, `.go`는 변환 완료 파일이다.
- 파일 tree, module structure, class/function/type name을 최대한 보존한다.
- Go idiom으로 재설계하지 않는다.
- 일반 알고리즘만 허용한다.
- AST assembly로 code generation한다.
- test는 수정하지 않는다.
- 모든 파일에 per-file wiki 문서를 둔다.

Nestia도 같은 방식이어야 한다. 특히 `packages/core/src/programmers`와 `packages/sdk/src/transformers`는 typia API 호출이 많으므로 이름과 책임을 보존한 1:1 포팅이 추적 가능성을 만든다.

## typia native backend의 위치

`packages/typia/src/transform.ts`는 얇은 manifest다.

- consumer project에서 `typia/package.json`을 resolve한다.
- package root의 `native/cmd/ttsc-typia`를 source로 반환한다.
- plugin name은 `typia`다.

native command는 다음을 제공한다.

- `build`: Program load, diagnostics, rewrite, emit
- `check`: `build --noEmit`
- `transform`: project 또는 single file transform
- `demo`
- `version`
- `help`

## adapter

`packages/typia/native/adapter`는 `ttsc` driver와 typia native core/transform 사이의 접착층이다.

역할:

- user source에서 typia call site 수집
- signature declaration path로 typia module 식별
- method/root/namespace 추출
- `ITypiaContext` 구성
- native `CallExpressionTransformer.Transform()` 호출
- printer로 JS 또는 type-preserving TS expression 출력
- unsupported generic call 진단
- CommonJS identifier substitution
- import cleanup

Nestia native backend도 이 adapter 수준의 접착층이 필요하다. 단, Nestia는 function call뿐 아니라 decorator call, method declaration, parameter declaration, class declaration을 다뤄야 한다.

