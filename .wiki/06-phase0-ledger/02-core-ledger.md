# Core Ledger

`@nestia/core`의 Go 포팅 직접 대상은 `src/transform.ts`, `src/transformers/**`, `src/programmers/**`, `src/options/**`다. 런타임 decorator와 adaptor는 TypeScript/NestJS surface로 유지하고, native output이 그 runtime helper를 동일하게 호출하는지 검증한다.

| 파일 | 라인 | 판정 | export | TS API | typia/API | 진단 | native/조치 |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `packages/core/src/adaptors/WebSocketAdaptor.ts` | 430 | `runtime-keep-ts` | `WebSocketAdaptor` | - | `typia` | `throw Error` | runtime 유지. native WebSocket metadata와 e2e parity만 검증. |
| `packages/core/src/decorators/DynamicModule.ts` | 45 | `runtime-keep-ts` | `DynamicModule` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/EncryptedBody.ts` | 98 | `runtime-keep-ts` | `EncryptedBody` | - | `typia` | `throw Error` | runtime 유지. encrypted body fixture 필요. |
| `packages/core/src/decorators/EncryptedController.ts` | 41 | `runtime-keep-ts` | `EncryptedController` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/EncryptedModule.ts` | 99 | `runtime-keep-ts` | `EncryptedModule` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/EncryptedRoute.ts` | 214 | `runtime-keep-ts` | `EncryptedRoute` | - | `typia` | `route_error` | runtime 유지. native response stringify plan parity 필요. |
| `packages/core/src/decorators/HumanRoute.ts` | 22 | `runtime-keep-ts` | `HumanRoute` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/NoTransformConfigurationError.ts` | 38 | `runtime-keep-ts` | `NoTransformConfigurationError` | - | - | `throw Error` | runtime 유지. no-transform regression fixture 유지. |
| `packages/core/src/decorators/PlainBody.ts` | 77 | `runtime-keep-ts` | `PlainBody` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/SwaggerCustomizer.ts` | 98 | `runtime-keep-ts` | `SwaggerCustomizer` | - | `@typia/interface`, `typia` | - | runtime 유지. |
| `packages/core/src/decorators/SwaggerExample.ts` | 181 | `runtime-keep-ts` | `SwaggerExample` | - | `typia` | - | runtime 유지. |
| `packages/core/src/decorators/TypedBody.ts` | 58 | `runtime-keep-ts` | `TypedBody` | - | `typia` | - | runtime 유지. native decorator argument injection 대상. |
| `packages/core/src/decorators/TypedException.ts` | 148 | `runtime-keep-ts` | `TypedException` | - | - | - | runtime 유지. SDK metadata fixture 필요. |
| `packages/core/src/decorators/TypedFormData.ts` | 188 | `runtime-keep-ts` | `TypedFormData` | - | - | `throw Error` | runtime 유지. form-data body/header fixture 필요. |
| `packages/core/src/decorators/TypedHeaders.ts` | 67 | `runtime-keep-ts` | `TypedHeaders` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/TypedParam.ts` | 78 | `runtime-keep-ts` | `TypedParam` | - | `typia` | `TypeGuardError` | runtime 유지. param field omission fixture 필요. |
| `packages/core/src/decorators/TypedQuery.ts` | 235 | `runtime-keep-ts` | `TypedQuery` | - | `typia` | `route_error` | runtime 유지. query decorator fixture 필요. |
| `packages/core/src/decorators/TypedRoute.ts` | 197 | `runtime-keep-ts` | `TypedRoute` | - | `typia` | `route_error` | runtime 유지. response stringify modes의 핵심 fixture. |
| `packages/core/src/decorators/WebSocketRoute.ts` | 243 | `runtime-keep-ts` | `WebSocketRoute` | - | - | - | runtime 유지. WebSocket route metadata fixture 필요. |
| `packages/core/src/decorators/doNotThrowTransformError.ts` | 6 | `runtime-keep-ts` | `doNotThrowTransformError` | - | - | - | runtime 유지. config loader와 연동. |
| `packages/core/src/decorators/internal/EncryptedConstant.ts` | 3 | `runtime-keep-ts` | `ENCRYPTION_METADATA_KEY` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/IWebSocketRouteReflect.ts` | 24 | `runtime-keep-ts` | `IWebSocketRouteReflect` | - | - | - | runtime DTO 유지. |
| `packages/core/src/decorators/internal/NoTransformConfigureError.ts` | 3 | `runtime-keep-ts` | `NoTransformConfigureError` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/get_path_and_querify.ts` | 95 | `runtime-keep-ts` | `get_path_and_querify` | - | `typia` | `throw Error`, `TypeGuardError` | runtime 유지. |
| `packages/core/src/decorators/internal/get_path_and_stringify.ts` | 111 | `runtime-keep-ts` | `get_path_and_stringify` | - | `typia` | `throw Error`, `TypeGuardError` | runtime 유지. |
| `packages/core/src/decorators/internal/get_text_body.ts` | 17 | `runtime-keep-ts` | `get_text_body` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/headers_to_object.ts` | 12 | `runtime-keep-ts` | `headers_to_object` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/is_request_body_undefined.ts` | 13 | `runtime-keep-ts` | `is_request_body_undefined` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/load_controller.ts` | 46 | `runtime-keep-ts` | `load_controllers` | - | - | - | runtime 유지. |
| `packages/core/src/decorators/internal/route_error.ts` | 44 | `runtime-keep-ts` | `route_error` | - | - | `route_error` | runtime 유지. |
| `packages/core/src/decorators/internal/validate_request_body.ts` | 65 | `runtime-keep-ts` | `validate_request_body` | - | `typia` | `TypeGuardError` | runtime 유지. |
| `packages/core/src/decorators/internal/validate_request_form_data.ts` | 68 | `runtime-keep-ts` | `validate_request_form_data` | - | `typia` | `TypeGuardError` | runtime 유지. |
| `packages/core/src/decorators/internal/validate_request_headers.ts` | 77 | `runtime-keep-ts` | `validate_request_headers` | - | `typia` | `TypeGuardError` | runtime 유지. |
| `packages/core/src/decorators/internal/validate_request_query.ts` | 65 | `runtime-keep-ts` | `validate_request_query` | - | `typia` | `TypeGuardError` | runtime 유지. |
| `packages/core/src/index.ts` | 6 | `surface-keep-ts` | re-export `module` | - | - | - | public surface 유지. |
| `packages/core/src/module.ts` | 24 | `surface-keep-ts` | decorators/utils re-export | - | - | - | public surface 유지. |
| `packages/core/src/options/INestiaTransformOptions.ts` | 35 | `native-shadow-contract` | `INestiaTransformOptions` | - | - | - | `packages/core/native/options/INestiaTransformOptions.go` |
| `packages/core/src/options/INestiaTransformProject.ts` | 11 | `native-shadow-contract` | `INestiaTransformContext` | - | `@typia/core` | - | `packages/core/native/options/INestiaTransformProject.go` |
| `packages/core/src/options/IRequestBodyValidator.ts` | 21 | `native-shadow-contract` | `IRequestBodyValidator` | - | `typia` | - | `packages/core/native/options/IRequestBodyValidator.go` |
| `packages/core/src/options/IRequestFormDataProps.ts` | 28 | `native-shadow-contract` | `IRequestFormDataProps` | - | `typia` | - | `packages/core/native/options/IRequestFormDataProps.go` |
| `packages/core/src/options/IRequestHeadersValidator.ts` | 23 | `native-shadow-contract` | `IRequestHeadersValidator` | - | `typia` | - | `packages/core/native/options/IRequestHeadersValidator.go` |
| `packages/core/src/options/IRequestQueryValidator.ts` | 21 | `native-shadow-contract` | `IRequestQueryValidator` | - | `typia` | - | `packages/core/native/options/IRequestQueryValidator.go` |
| `packages/core/src/options/IResponseBodyQuerifier.ts` | 26 | `native-shadow-contract` | `IResponseBodyQuerifier` | - | `typia` | - | `packages/core/native/options/IResponseBodyQuerifier.go` |
| `packages/core/src/options/IResponseBodyStringifier.ts` | 31 | `native-shadow-contract` | `IResponseBodyStringifier` | - | `typia` | - | `packages/core/native/options/IResponseBodyStringifier.go` |
| `packages/core/src/programmers/PlainBodyProgrammer.ts` | 73 | `native-port` | `PlainBodyProgrammer` | `Expression`, `Type` | `AssertProgrammer`, `MetadataFactory` | - | `packages/core/native/programmers/PlainBodyProgrammer.go` |
| `packages/core/src/programmers/TypedBodyProgrammer.ts` | 149 | `native-port` | `TypedBodyProgrammer` | `Expression`, `ObjectLiteralExpression`, `Type`, `factory` | `AssertProgrammer`, `IsProgrammer`, `ValidateProgrammer` | - | `packages/core/native/programmers/TypedBodyProgrammer.go` |
| `packages/core/src/programmers/TypedFormDataBodyProgrammer.ts` | 119 | `native-port` | `TypedFormDataBodyProgrammer` | `Expression`, `ObjectLiteralExpression`, `Type`, `factory` | `HttpAssertFormDataProgrammer`, `HttpFormDataProgrammer`, `MetadataFactory` | - | `packages/core/native/programmers/TypedFormDataBodyProgrammer.go` |
| `packages/core/src/programmers/TypedHeadersProgrammer.ts` | 66 | `native-port` | `TypedHeadersProgrammer` | `Expression`, `Type`, `factory` | `HttpAssertHeadersProgrammer`, `HttpIsHeadersProgrammer`, `HttpValidateHeadersProgrammer` | - | `packages/core/native/programmers/TypedHeadersProgrammer.go` |
| `packages/core/src/programmers/TypedParamProgrammer.ts` | 34 | `native-port` | `TypedParamProgrammer` | `Expression`, `Type`, `factory` | `HttpParameterProgrammer` | - | `packages/core/native/programmers/TypedParamProgrammer.go` |
| `packages/core/src/programmers/TypedQueryBodyProgrammer.ts` | 114 | `native-port` | `TypedQueryBodyProgrammer` | `Expression`, `ObjectLiteralExpression`, `Type`, `factory` | `HttpQueryProgrammer`, `MetadataFactory` | - | `packages/core/native/programmers/TypedQueryBodyProgrammer.go` |
| `packages/core/src/programmers/TypedQueryProgrammer.ts` | 116 | `native-port` | `TypedQueryProgrammer` | `Expression`, `Type`, `factory` | `HttpQueryProgrammer`, `MetadataFactory` | - | `packages/core/native/programmers/TypedQueryProgrammer.go` |
| `packages/core/src/programmers/TypedQueryRouteProgrammer.ts` | 108 | `native-port` | `TypedQueryRouteProgrammer` | `ArrowFunction`, `Expression`, `Type`, `factory` | `HttpQuerifyProgrammer`, `HttpValidateQuerifyProgrammer` | - | `packages/core/native/programmers/TypedQueryRouteProgrammer.go` |
| `packages/core/src/programmers/TypedRouteProgrammer.ts` | 104 | `native-port` | `TypedRouteProgrammer` | `Expression`, `Type`, `factory` | `JsonStringifyProgrammer` | - | `packages/core/native/programmers/TypedRouteProgrammer.go` |
| `packages/core/src/programmers/http/HttpAssertQuerifyProgrammer.ts` | 75 | `native-port` | `HttpAssertQuerifyProgrammer` | `ArrowFunction`, `Type`, `factory` | `AssertProgrammer`, `HttpQuerifyProgrammer` | - | `packages/core/native/programmers/http/HttpAssertQuerifyProgrammer.go` |
| `packages/core/src/programmers/http/HttpIsQuerifyProgrammer.ts` | 78 | `native-port` | `HttpIsQuerifyProgrammer` | `ArrowFunction`, `Type`, `factory` | `IsProgrammer`, `HttpQuerifyProgrammer` | - | `packages/core/native/programmers/http/HttpIsQuerifyProgrammer.go` |
| `packages/core/src/programmers/http/HttpQuerifyProgrammer.ts` | 111 | `native-port` | `HttpQuerifyProgrammer` | `ArrowFunction`, `CallExpression`, `factory` | `HttpQueryProgrammer`, `MetadataFactory` | - | `packages/core/native/programmers/http/HttpQuerifyProgrammer.go` |
| `packages/core/src/programmers/http/HttpValidateQuerifyProgrammer.ts` | 79 | `native-port` | `HttpValidateQuerifyProgrammer` | `ArrowFunction`, `Type`, `factory` | `ValidateProgrammer`, `HttpQuerifyProgrammer` | - | `packages/core/native/programmers/http/HttpValidateQuerifyProgrammer.go` |
| `packages/core/src/programmers/internal/CoreMetadataUtil.ts` | 22 | `native-port` | `CoreMetadataUtil` | - | `@typia/core` | - | `packages/core/native/programmers/internal/CoreMetadataUtil.go` |
| `packages/core/src/transform.ts` | 36 | `manifest/legacy-transform` | `transform` | `Program`, `DiagnosticCategory`, `createPrinter` | `ITypiaContext` | `extras.addDiagnostic` | JS file becomes `createTtscPlugin()` manifest; legacy function moves to compatibility path. |
| `packages/core/src/transformers/FileTransformer.ts` | 110 | `native-port` | `FileTransformer` | `SourceFile`, `Statement`, `factory`, `isStringLiteralLike` | `ITypiaContext` | `extras.addDiagnostic` | `packages/core/native/transformers/FileTransformer.go` |
| `packages/core/src/transformers/MethodTransformer.ts` | 104 | `native-port` | `MethodTransformer` | `MethodDeclaration`, `Signature`, `TypeChecker`, `TypeReference` | - | `throw Error` | `packages/core/native/transformers/MethodTransformer.go` |
| `packages/core/src/transformers/NodeTransformer.ts` | 24 | `native-port` | `NodeTransformer` | `Node`, `isMethodDeclaration`, `isParameter` | - | - | `packages/core/native/transformers/NodeTransformer.go` |
| `packages/core/src/transformers/ParameterDecoratorTransformer.ts` | 144 | `native-port` | `ParameterDecoratorTransformer` | `Decorator`, `TypeNode`, `LeftHandSideExpression` | - | - | `packages/core/native/transformers/ParameterDecoratorTransformer.go` |
| `packages/core/src/transformers/ParameterTransformer.ts` | 58 | `native-port` | `ParameterTransformer` | `ParameterDeclaration`, `getDecorators`, `factory` | - | - | `packages/core/native/transformers/ParameterTransformer.go` |
| `packages/core/src/transformers/TypedRouteTransformer.ts` | 86 | `native-port` | `TypedRouteTransformer` | `Decorator`, `Signature`, `TypeChecker`, `TypeFlags`, `TypeNode` | - | - | `packages/core/native/transformers/TypedRouteTransformer.go` |
| `packages/core/src/transformers/WebSocketRouteTransformer.ts` | 121 | `native-port` | `WebSocketRouteTransformer` | `MethodDeclaration`, `DiagnosticWithLocation`, `isCallExpression` | - | `extras.addDiagnostic` | `packages/core/native/transformers/WebSocketRouteTransformer.go` |
| `packages/core/src/typings/Creator.ts` | 4 | `surface-keep-ts` | `Creator` | - | - | - | public type 유지. |
| `packages/core/src/typings/get-function-location.d.ts` | 8 | `surface-keep-ts` | ambient module | - | - | - | declaration 유지. |
| `packages/core/src/utils/ArrayUtil.ts` | 8 | `utility-keep-ts` | `ArrayUtil` | - | - | - | TS runtime utility 유지. |
| `packages/core/src/utils/ExceptionManager.ts` | 116 | `utility-keep-ts` | `ExceptionManager` | - | `typia` | `TypeGuardError` | runtime utility 유지. |
| `packages/core/src/utils/Singleton.ts` | 17 | `utility-keep-ts` | `Singleton` | - | - | - | TS runtime utility 유지. |
| `packages/core/src/utils/SourceFinder.ts` | 55 | `utility-compiler-api` | `SourceFinder` | compiler-like source lookup | - | - | native adapter에 path/source-file lookup 대응 필요. |
| `packages/core/src/utils/VersioningStrategy.ts` | 28 | `utility-keep-ts` | `VersioningStrategy` | - | - | - | runtime utility 유지. |

## Native 구현 묶음

1. `transform.ts`는 `typia@next/packages/typia/src/transform.ts`처럼 package root를 찾고 `native/cmd/ttsc-nestia`를 반환한다.
2. `transformers/**`는 decorator 탐색, signature/type 해석, source rewrite range 생성을 맡는다.
3. `programmers/**`는 typia native core/programmer 호출을 감싼다. TS `ts.factory` 출력물은 Go printer 표현으로 바꾸되, 원본 decorator argument order를 golden fixture로 잠근다.
4. `options/**`는 public TS interface를 그대로 두고 `--plugins-json` parser의 Go struct로 shadowing한다.

