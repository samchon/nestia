# typia TS/Go 대응성

## 파일 대응

`../typia/packages/core/src/**`와 `typia@next/packages/typia/native/core/**`는 파일 경로가 대응한다.

`../typia/packages/transform/src/**`와 `typia@next/packages/typia/native/transform/**`도 대응한다.

이 대응성은 Nestia에서 매우 중요하다. Nestia도 포팅할 때 다음 식의 추적이 가능해야 한다.

```text
packages/core/src/programmers/TypedBodyProgrammer.ts
-> packages/core/native/core/programmers/TypedBodyProgrammer.go

packages/sdk/src/transformers/SdkOperationProgrammer.ts
-> packages/sdk/native/sdk/transformers/SdkOperationProgrammer.go
```

## 알고리즘 대응 예시

`CallExpressionTransformer.ts`와 `CallExpressionTransformer.go`는 module/method dispatcher 구조를 보존한다.

- `module`
- `functional`
- `http`
- `llm`
- `json`
- `protobuf`
- `reflect`
- `misc`
- `notations`

`IsProgrammer.ts`와 `IsProgrammer.go`는 `configure`, `decompose`, `write`, `decode`, `CheckerProgrammer`, `FeatureProgrammer`, object check functor 흐름을 유지한다.

`MetadataFactory.ts`와 `MetadataFactory.go`는 type exploration, collection iteration, validation visitor를 보존한다.

## Nestia에 필요한 typia API

Nestia core transformer가 직접 사용하는 typia 계층:

- `AssertProgrammer`
- `IsProgrammer`
- `ValidateProgrammer`
- `MiscAssertCloneProgrammer`
- `MiscValidateCloneProgrammer`
- `MiscAssertPruneProgrammer`
- `MiscValidatePruneProgrammer`
- `JsonStringifyProgrammer`
- `JsonAssertStringifyProgrammer`
- `JsonIsStringifyProgrammer`
- `JsonValidateStringifyProgrammer`
- `HttpAssertQuerifyProgrammer`
- `HttpIsQuerifyProgrammer`
- `HttpValidateQuerifyProgrammer`
- `HttpQueryProgrammer`
- `HttpHeadersProgrammer`
- `HttpParameterProgrammer`
- `HttpFormDataProgrammer`
- `JsonMetadataFactory`
- `MetadataFactory`
- `LlmSchemaProgrammer`
- `LlmParametersProgrammer`

Nestia SDK transformer가 사용하는 typia 계층:

- `MetadataFactory`
- `MetadataCollection`
- `MetadataSchema`
- `LiteralFactory`
- `TypeFactory`
- `CommentFactory`
- validation pipe shape

따라서 Nestia native backend는 typia native core를 library로 import해야 하며, TypeScript 원본 `@typia/core` import를 문자열로 흉내내면 안 된다.
