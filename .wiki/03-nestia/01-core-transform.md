# @nestia/core Transform 구조

## entry

`packages/core/src/transform.ts`는 TypeScript transformer entry다.

흐름:

1. `program.getCompilerOptions()`
2. `strictNullChecks` 또는 `strict` 확인
3. strict가 아니면 diagnostic 추가
4. `FileTransformer.transform()`에 checker, printer, compilerOptions, options, extras 전달

Go 포팅에서는 이 파일이 `createTtscPlugin()` manifest로 바뀌어야 한다. strict diagnostics는 native sidecar가 `driver.Program`의 parsed compiler options에서 확인한다.

## FileTransformer

`FileTransformer`는 source file 단위 visitor다.

- declaration file은 건너뛴다.
- `ImportProgrammer`를 `internalPrefix: "nestia_core_transform"`로 만든다.
- node visitor에서 `TransformerError`를 잡아 diagnostics에 넣는다.
- 필요한 import statements를 `"use ..."` directive 뒤에 주입한다.

Go 포팅의 핵심 과제는 `ImportProgrammer`와 import injection이다. typia native adapter의 cleanup/import substitution을 참고하되, Nestia는 decorator argument에 import alias를 직접 넣으므로 source-level TS output과 JS emit output 양쪽을 검증해야 한다.

## NodeTransformer

`NodeTransformer`는 두 종류만 dispatch한다.

- `MethodDeclaration` -> `MethodTransformer`
- `Parameter` -> `ParameterTransformer`

이 단순성은 Go port에 유리하다. Go adapter도 visitor를 넓게 만들지 말고 이 두 node type에서 시작한다.

## MethodTransformer

`MethodTransformer`는 method decorator를 처리한다.

- decorators가 없으면 원본 반환
- return type을 checker로 얻음
- Promise면 type argument를 return type으로 사용
- 각 decorator에 `TypedRouteTransformer.transform`
- 각 decorator에 `WebSocketRouteTransformer.validate`

Go port 주의점:

- TypeScript-Go에서 Promise type detection은 symbol name과 type arguments로 해야 한다.
- decorator modifier 위치는 TS 5 최신 API와 legacy decorator shape를 둘 다 고려해야 한다.

## ParameterTransformer와 ParameterDecoratorTransformer

`ParameterTransformer`는 parameter decorator를 돌며 parameter type을 전달한다.

`ParameterDecoratorTransformer`는 다음 기준으로 Nestia decorator를 식별한다.

- decorator expression이 call expression인지
- resolved signature declaration이 있는지
- declaration source file path가 `@nestia/core/lib/decorators` 또는 `packages/core/src/decorators`인지
- declaration symbol name이 functor map에 있는지

대상 functor:

- `EncryptedBody`
- `TypedBody`
- `TypedHeaders`
- `TypedParam`
- `TypedQuery`
- `TypedQuery.Body`
- `TypedFormData.Body`
- `PlainBody`
- `WebSocketRoute.Header`
- `WebSocketRoute.Param`
- `WebSocketRoute.Query`

Go port는 path substring만으로 끝내지 말고 package root resolution과 source file suffix normalization을 같이 해야 한다.

## Programmer 계층

`programmers/**`는 decorator 인자에 들어갈 plan object를 만든다.

- body/header/query/param validators
- route response stringify/validate plan
- query route querify plan
- form-data body plan
- plain text body plan

대부분 typia core programmers를 호출한다. 따라서 Nestia native core는 typia native core를 반드시 link해야 한다.

