# SDK Ledger

`@nestia/sdk`는 두 축을 분리한다.

- `src/transform.ts`와 `src/transformers/**`: `OperationMetadata` decorator를 주입하는 native transform 직접 대상.
- `src/generates/**`, `NestiaSdkApplication`, `NestiaSwaggerComposer`: TypeScript runtime generator로 유지. 다만 `NestiaConfigLoader`는 `ts-node` plugin 실행을 버리고 `ttsc` compile output materialization으로 바꾼다.

| 파일 | 라인 | 판정 | export | TS API | typia/API | 진단 | native/조치 |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `packages/sdk/src/INestiaConfig.ts` | 268 | `surface-keep-ts` | `INestiaConfig` | - | `typia` | - | public config 유지. config bridge에서 validate 대상. |
| `packages/sdk/src/NestiaSdkApplication.ts` | 308 | `sdk-cli-runtime` | `NestiaSdkApplication` | - | `@typia/core`, `typia` | `throw Error` | generator orchestration 유지. native metadata parity input으로 검증. |
| `packages/sdk/src/NestiaSwaggerComposer.ts` | 144 | `sdk-cli-runtime` | `NestiaSwaggerComposer` | - | `@typia/core`, `@typia/interface`, `@typia/utils` | `throw Error` | swagger composer 유지. |
| `packages/sdk/src/analyses/AccessorAnalyzer.ts` | 68 | `analysis` | `AccessorAnalyzer` | - | `@typia/utils` | - | TS 유지. |
| `packages/sdk/src/analyses/ConfigAnalyzer.ts` | 156 | `analysis-compiler-api` | `ConfigAnalyzer` | compiler options shape | - | - | config bridge 이후 Go 이전 여부 재판정. |
| `packages/sdk/src/analyses/DtoAnalyzer.ts` | 261 | `analysis-compiler-api` | `DtoAnalyzer` | `SourceFile`, `Symbol`, `Type`, `TypeChecker`, `TypeNode` | - | - | `packages/sdk/native/analyses/DtoAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/ExceptionAnalyzer.ts` | 155 | `analysis-compiler-api` | namespace export | `Decorator`, `MethodDeclaration`, `Signature`, `TypeChecker` | `MetadataFactory`, `MetadataCollection` | - | `packages/sdk/native/analyses/ExceptionAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/GenericAnalyzer.ts` | 50 | `analysis-compiler-api` | `GenericAnalyzer` | `ClassDeclaration`, `TypeParameterDeclaration` | - | - | `packages/sdk/native/analyses/GenericAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/ImportAnalyzer.ts` | 127 | `analysis-compiler-api` | `ImportAnalyzer` | `SourceFile`, `ImportDeclaration`, `NamedImports` | `typia` comment path | - | `packages/sdk/native/analyses/ImportAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/PathAnalyzer.ts` | 70 | `analysis` | `PathAnalyzer` | - | - | - | TS 유지. |
| `packages/sdk/src/analyses/ReflectControllerAnalyzer.ts` | 106 | `analysis` | `ReflectControllerAnalyzer` | - | - | - | reflection result analyzer 유지. |
| `packages/sdk/src/analyses/ReflectHttpOperationAnalyzer.ts` | 184 | `analysis` | `ReflectHttpOperationAnalyzer` | - | - | - | reflection result analyzer 유지. |
| `packages/sdk/src/analyses/ReflectHttpOperationExceptionAnalyzer.ts` | 73 | `analysis` | `ReflectHttpOperationExceptionAnalyzer` | - | `@typia/core` | - | TS 유지. |
| `packages/sdk/src/analyses/ReflectHttpOperationParameterAnalyzer.ts` | 351 | `analysis-compiler-api` | `ReflectHttpOperationParameterAnalyzer` | type/category logic | `HttpFormDataProgrammer`, `HttpHeadersProgrammer`, `HttpParameterProgrammer`, `HttpQueryProgrammer` | - | `packages/sdk/native/analyses/ReflectHttpOperationParameterAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/ReflectHttpOperationResponseAnalyzer.ts` | 127 | `analysis` | `ReflectHttpOperationResponseAnalyzer` | - | `@typia/core`, `HttpQueryProgrammer` | - | TS 유지. |
| `packages/sdk/src/analyses/ReflectMetadataAnalyzer.ts` | 45 | `analysis` | `ReflectMetadataAnalyzer` | - | - | - | TS 유지. |
| `packages/sdk/src/analyses/ReflectWebSocketOperationAnalyzer.ts` | 173 | `analysis-compiler-api` | `ReflectWebSocketOperationAnalyzer` | route parameter metadata | - | - | `packages/sdk/native/analyses/ReflectWebSocketOperationAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/SecurityAnalyzer.ts` | 26 | `analysis` | `SecurityAnalyzer` | - | - | - | TS 유지. |
| `packages/sdk/src/analyses/TypedHttpRouteAnalyzer.ts` | 209 | `analysis-compiler-api` | `TypedHttpRouteAnalyzer` | route metadata from type/checker | `@typia/core`, `@typia/utils`, `MetadataFactory` | - | `packages/sdk/native/analyses/TypedHttpRouteAnalyzer.go` 후보. |
| `packages/sdk/src/analyses/TypedWebSocketRouteAnalyzer.ts` | 34 | `analysis` | `TypedWebSocketRouteAnalyzer` | - | - | - | TS 유지. |
| `packages/sdk/src/decorators/OperationMetadata.ts` | 16 | `runtime-keep-ts` | `OperationMetadata` | - | - | - | runtime decorator 유지. native transform output target. |
| `packages/sdk/src/executable/internal/CommandParser.ts` | 16 | `sdk-cli-runtime` | `CommandParser` | - | - | - | CLI parser 유지. |
| `packages/sdk/src/executable/internal/NestiaConfigLoader.ts` | 82 | `config-bridge` | `NestiaConfigLoader` | `findConfigFile`, `parseJsonConfigFileContent`, `ParsedCommandLine` | `typia` | `throw Error`, `TypeGuardError` | `ts-node.register({ plugins })` 제거. `TtscCompiler.compile()` materialization helper 추가. |
| `packages/sdk/src/executable/internal/NestiaSdkCommand.ts` | 108 | `sdk-cli-runtime` | `NestiaSdkCommand` | `ParsedCommandLine` | - | `throw Error` | command orchestration 유지. config bridge 호출부 수정. |
| `packages/sdk/src/executable/sdk.ts` | 78 | `sdk-cli-runtime` | CLI entry | - | `typia` | - | executable 유지. |
| `packages/sdk/src/generates/CloneGenerator.ts` | 67 | `generator-keep-ts` | `CloneGenerator` | `NodeFlags`, `Statement`, `factory` | - | - | generator 유지. |
| `packages/sdk/src/generates/E2eGenerator.ts` | 33 | `generator-keep-ts` | `E2eGenerator` | - | - | - | generator 유지. |
| `packages/sdk/src/generates/SdkGenerator.ts` | 161 | `generator-keep-ts` | `SdkGenerator` | - | `typia` | `throw Error` | generator 유지. output diff gate. |
| `packages/sdk/src/generates/SwaggerGenerator.ts` | 292 | `generator-keep-ts` | `SwaggerGenerator` | - | `@typia/core`, `@typia/interface`, `@typia/utils` | `throw Error` | generator 유지. |
| `packages/sdk/src/generates/internal/E2eFileProgrammer.ts` | 197 | `generator-keep-ts` | `E2eFileProgrammer` | `NodeFlags`, `Statement`, `factory` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/FilePrinter.ts` | 65 | `generator-keep-ts` | `FilePrinter` | `Node`, `addSyntheticLeadingComment`, `factory` | - | - | generator printer 유지. native source transform printer와 분리. |
| `packages/sdk/src/generates/internal/ImportDictionary.ts` | 193 | `generator-keep-ts` | `ImportDictionary` | `ImportDeclaration`, `Statement`, `factory` | - | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkAliasCollection.ts` | 261 | `generator-keep-ts` | `SdkAliasCollection` | `PropertySignature`, `TypeNode`, `factory` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkDistributionComposer.ts` | 104 | `generator-keep-ts` | `SdkDistributionComposer` | - | `typia` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkFileProgrammer.ts` | 111 | `generator-keep-ts` | `SdkFileProgrammer` | `Statement`, `factory` | - | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpCloneProgrammer.ts` | 127 | `generator-keep-ts` | `SdkHttpCloneProgrammer` | `TypeAliasDeclaration`, `factory` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpCloneReferencer.ts` | 78 | `generator-keep-ts` | `SdkHttpCloneReferencer` | - | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpFunctionProgrammer.ts` | 279 | `generator-keep-ts` | `SdkHttpFunctionProgrammer` | `Expression`, `FunctionDeclaration`, `Statement`, `factory` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpNamespaceProgrammer.ts` | 503 | `generator-keep-ts` | `SdkHttpNamespaceProgrammer` | `ModuleDeclaration`, `TypeAliasDeclaration`, `TypeNode` | `@typia/core`, `@typia/utils` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpParameterProgrammer.ts` | 179 | `generator-keep-ts` | `SdkHttpParameterProgrammer` | `ParameterDeclaration`, `TypeNode`, `factory` | - | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpRouteProgrammer.ts` | 110 | `generator-keep-ts` | `SdkHttpRouteProgrammer` | `Statement` | `typia` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkHttpSimulationProgrammer.ts` | 313 | `generator-keep-ts` | `SdkHttpSimulationProgrammer` | `Expression`, `Statement`, `factory` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkImportWizard.ts` | 63 | `generator-keep-ts` | `SdkImportWizard` | - | `typia` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkRouteDirectory.ts` | 19 | `generator-keep-ts` | `SdkRouteDirectory` | - | - | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkTypeProgrammer.ts` | 389 | `generator-keep-ts` | `SdkTypeProgrammer` | `PropertySignature`, `TypeLiteralNode`, `TypeNode`, `factory` | `@typia/core`, `@typia/utils` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkTypeTagProgrammer.ts` | 115 | `generator-keep-ts` | `SdkTypeTagProgrammer` | `factory` | `@typia/core`, `@typia/interface` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkWebSocketNamespaceProgrammer.ts` | 380 | `generator-keep-ts` | `SdkWebSocketNamespaceProgrammer` | `ModuleDeclaration`, `TypeAliasDeclaration`, `TypeNode` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkWebSocketParameterProgrammer.ts` | 88 | `generator-keep-ts` | `SdkWebSocketParameterProgrammer` | `ParameterDeclaration`, `TypeNode`, `factory` | - | - | generator 유지. |
| `packages/sdk/src/generates/internal/SdkWebSocketRouteProgrammer.ts` | 303 | `generator-keep-ts` | `SdkWebSocketRouteProgrammer` | `Expression`, `FunctionDeclaration`, `Statement`, `TypeNode` | `@typia/core` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SwaggerDescriptionComposer.ts` | 65 | `generator-keep-ts` | `SwaggerDescriptionComposer` | - | `typia` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SwaggerOperationComposer.ts` | 120 | `generator-keep-ts` | `SwaggerOperationComposer` | - | `@typia/core`, `@typia/interface` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SwaggerOperationParameterComposer.ts` | 162 | `generator-keep-ts` | `SwaggerOperationParameterComposer` | - | `@typia/core`, `@typia/interface` | - | generator 유지. |
| `packages/sdk/src/generates/internal/SwaggerOperationResponseComposer.ts` | 111 | `generator-keep-ts` | `SwaggerOperationResponseComposer` | - | `@typia/core`, `@typia/interface` | - | generator 유지. |
| `packages/sdk/src/index.ts` | 5 | `surface-keep-ts` | re-export `module` | - | - | - | public surface 유지. |
| `packages/sdk/src/module.ts` | 5 | `surface-keep-ts` | core public exports | - | - | - | public surface 유지. |
| `packages/sdk/src/structures/INestiaProject.ts` | 14 | `dto-keep-ts` | `INestiaProject` | `TypeChecker` | - | - | config/runtime DTO 유지. |
| `packages/sdk/src/structures/INestiaSdkInput.ts` | 21 | `dto-keep-ts` | `INestiaSdkInput` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectApplication.ts` | 9 | `dto-keep-ts` | `IReflectApplication` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectController.ts` | 16 | `dto-keep-ts` | `IReflectController` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectHttpOperation.ts` | 27 | `dto-keep-ts` | `IReflectHttpOperation` | - | `typia` | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectHttpOperationException.ts` | 19 | `dto-keep-ts` | `IReflectHttpOperationException` | - | `@typia/core`, `MetadataFactory` | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectHttpOperationParameter.ts` | 80 | `dto-keep-ts` | `IReflectHttpOperationParameter` | - | `@typia/core`, `MetadataFactory` | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectHttpOperationSuccess.ts` | 22 | `dto-keep-ts` | `IReflectHttpOperationSuccess` | - | `@typia/core`, `MetadataFactory` | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectImport.ts` | 7 | `dto-keep-ts` | `IReflectImport` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectOperationError.ts` | 27 | `dto-keep-ts` | `IReflectOperationError` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectType.ts` | 5 | `dto-keep-ts` | `IReflectType` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectWebSocketOperation.ts` | 18 | `dto-keep-ts` | `IReflectWebSocketOperation` | `JSDocTagInfo` | - | - | DTO 유지. |
| `packages/sdk/src/structures/IReflectWebSocketOperationParameter.ts` | 37 | `dto-keep-ts` | `IReflectWebSocketOperationParameter` | - | `typia` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedApplication.ts` | 12 | `dto-keep-ts` | `ITypedApplication` | - | `@typia/core` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedHttpRoute.ts` | 42 | `dto-keep-ts` | `ITypedHttpRoute` | - | `typia` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedHttpRouteException.ts` | 16 | `dto-keep-ts` | `ITypedHttpRouteException` | - | `@typia/core` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedHttpRouteParameter.ts` | 42 | `dto-keep-ts` | `ITypedHttpRouteParameter` | - | `@typia/core` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedHttpRouteSuccess.ts` | 23 | `dto-keep-ts` | `ITypedHttpRouteSuccess` | - | `@typia/core` | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedWebSocketRoute.ts` | 25 | `dto-keep-ts` | `ITypedWebSocketRoute` | `JSDocTagInfo` | - | - | DTO 유지. |
| `packages/sdk/src/structures/ITypedWebSocketRouteParameter.ts` | 4 | `dto-keep-ts` | interface | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/MethodType.ts` | 6 | `dto-keep-ts` | `MethodType` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/ParamCategory.ts` | 2 | `dto-keep-ts` | `ParamCategory` | - | - | - | DTO 유지. |
| `packages/sdk/src/structures/TypeEntry.ts` | 23 | `dto-keep-ts` | `TypeEntry` | `Type` | - | - | DTO 유지. |
| `packages/sdk/src/transform.ts` | 10 | `manifest/legacy-transform` | `transform` | `Program`, `TransformerFactory` | - | - | JS file becomes same `ttsc-nestia` manifest source as core. |
| `packages/sdk/src/transformers/IOperationMetadata.ts` | 47 | `native-port` | `IOperationMetadata` | - | `@typia/interface` | - | `packages/sdk/native/transformers/IOperationMetadata.go` |
| `packages/sdk/src/transformers/ISdkOperationTransformerContext.ts` | 9 | `native-port` | `ISdkOperationTransformerContext` | `TransformationContext`, `TypeChecker` | `MetadataCollection` | - | `packages/sdk/native/transformers/ISdkOperationTransformerContext.go` |
| `packages/sdk/src/transformers/SdkOperationProgrammer.ts` | 241 | `native-port` | `SdkOperationProgrammer` | `MethodDeclaration`, `ParameterDeclaration`, `Signature`, `TypeChecker`, `TypeNode` | `MetadataCollection`, `MetadataFactory` | - | `packages/sdk/native/transformers/SdkOperationProgrammer.go` |
| `packages/sdk/src/transformers/SdkOperationTransformer.ts` | 249 | `native-port` | `SdkOperationTransformer` | `ClassDeclaration`, `Decorator`, `MethodDeclaration`, `SourceFile` | `MetadataCollection` | - | `packages/sdk/native/transformers/SdkOperationTransformer.go` |
| `packages/sdk/src/transformers/TextPlainValidator.ts` | 18 | `native-port` | `TextPlainValidator` | - | `@typia/core` | - | `packages/sdk/native/transformers/TextPlainValidator.go` |
| `packages/sdk/src/typings/get-function-location.d.ts` | 8 | `surface-keep-ts` | ambient module | - | - | - | declaration 유지. |
| `packages/sdk/src/utils/ArrayUtil.ts` | 27 | `utility-keep-ts` | `ArrayUtil` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/FileRetriever.ts` | 23 | `utility-keep-ts` | `FileRetriever` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/MapUtil.ts` | 15 | `utility-keep-ts` | `MapUtil` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/MetadataUtil.ts` | 27 | `utility-compiler-api` | `MetadataUtil` | metadata type access | `@typia/core` | - | native analyzer helper 후보. |
| `packages/sdk/src/utils/PathUtil.ts` | 11 | `utility-keep-ts` | `PathUtil` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/SourceFinder.ts` | 64 | `utility-compiler-api` | `SourceFinder` | source/signature path lookup | - | - | native adapter helper 후보. |
| `packages/sdk/src/utils/StringUtil.ts` | 18 | `utility-keep-ts` | `StringUtil` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/StripEnums.ts` | 6 | `utility-keep-ts` | `StripEnums` | - | - | - | TS 유지. |
| `packages/sdk/src/utils/TypeLiteralExpression.ts` | 0 | `utility-keep-ts` | - | - | - | - | empty file. cleanup or keep-neutral. |
| `packages/sdk/src/utils/VersioningStrategy.ts` | 29 | `utility-keep-ts` | `VersioningStrategy` | - | - | - | TS 유지. |
| `packages/sdk/src/validators/HttpHeadersValidator.ts` | 41 | `runtime-validator-keep-ts` | `HttpHeadersValidator` | - | `MetadataFactory` | - | runtime validator 유지. |
| `packages/sdk/src/validators/HttpQueryValidator.ts` | 41 | `runtime-validator-keep-ts` | `HttpQueryValidator` | - | `MetadataFactory` | - | runtime validator 유지. |

## SDK 구현 순서

1. `packages/sdk/src/transform.ts`를 core와 같은 `ttsc-nestia` manifest로 전환한다.
2. `SdkOperationTransformer`와 `SdkOperationProgrammer`를 먼저 Go로 옮겨 `OperationMetadata` decorator literal parity를 만든다.
3. `NestiaConfigLoader`는 `TtscCompiler.compile()` 결과를 temp directory에 materialize한 뒤 compiled config module을 import한다. 이 방식이 1차 공식 bridge다.
4. SDK/Swagger/E2E generator는 TypeScript runtime으로 유지하고, native transform이 만든 metadata reflection output을 입력으로 검증한다.

