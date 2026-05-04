# @nestia/sdk Transform 및 Generation 구조

## transform entry

`packages/sdk/src/transform.ts`는 `SdkOperationTransformer.iterateFile(program.getTypeChecker())`를 반환한다.

이 transformer는 controller method에 `OperationMetadata` decorator를 주입한다. SDK generator는 runtime reflection으로 이 metadata를 읽는다.

## SdkOperationTransformer

핵심 흐름:

1. source file declaration 건너뜀
2. `MetadataCollection` singleton 준비
3. class declaration 방문
4. method declaration별 symbol lookup
5. decorator가 있는 method만 처리
6. `SdkOperationProgrammer.write()`로 metadata literal 생성
7. `__OperationMetadata.OperationMetadata(metadata as any)` decorator를 method modifiers에 추가
8. 파일 상단에 `import * as __OperationMetadata from "@nestia/sdk"` 추가

Go port 주의점:

- method 중복 방문 방지를 `className/methodName` hash로 한다.
- JSDoc comment/tag 수집은 TypeScript-Go shim에서 가능한 API 범위를 확인해야 한다.
- `LiteralFactory.write(metadata)`를 Go에서 재현해야 한다.
- decorator injection 후 printer가 기존 decorator/modifier 순서를 안정적으로 보존해야 한다.

## SdkOperationProgrammer

`SdkOperationProgrammer.write()`는 parameter/success/exception metadata를 생성한다.

사용하는 typia 기능:

- `MetadataFactory.analyze`
- `MetadataCollection`
- `MetadataSchema`
- `CommentFactory.description`
- `TypeFactory.keyword`
- `DtoAnalyzer`

metadata에는 두 schema가 들어간다.

- `primitive`: `escape: true`
- `resolved`: `escape: false`

parameter optionality는 `questionToken`으로 metadata에 반영한다. return type은 `Promise<T>`이면 `T`로 unwrap한다.

## runtime reflection pipeline

`NestiaSdkApplication.generate()`는 runtime reflection을 기반으로 한다.

1. config input 분석
2. controller class import 또는 Nest application container 분석
3. `ReflectControllerAnalyzer`
4. `ReflectHttpOperationAnalyzer` 또는 `ReflectWebSocketOperationAnalyzer`
5. typed route 변환
6. `AccessorAnalyzer`
7. validate
8. `SdkGenerator`, `E2eGenerator`, `SwaggerGenerator`

즉 SDK generator는 native transformer만으로 끝나지 않는다. config/controller source를 변환된 상태로 실행해야 runtime metadata가 생긴다.

## ConfigLoader 병목

`NestiaConfigLoader.configurations()`는 현재 `ts-node.register()`를 사용한다.

```ts
register({
  emit: false,
  compilerOptions: {
    ...compilerOptions,
    plugins,
  },
});
```

이 방식은 ttsc native plugin 실행 경로가 아니다. Go 포팅에서는 CLI가 config를 load하기 전에 ttsc compile/execute bridge를 사용해야 한다.

권장 방향:

- `NestiaConfigLoader`가 project compiler options를 읽는다.
- sdk transform plugin이 빠져 있으면 in-memory plugin list에 추가한다.
- `TtscCompiler.compile()`로 config와 controller graph를 temp output에 compile한다.
- compiled config module을 import한다.
- temp output/cache lifecycle을 명시한다.

## Generator

`SdkGenerator.generate()`는 filesystem writer다.

- bundle asset copy
- clone structure generation
- functional SDK file generation
- distribution composer

이 계층은 ttsc transform sidecar의 직접 대상이 아니다. Native rewrite보다 output deterministic test와 config execution bridge가 먼저다.

