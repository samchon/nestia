# typia native backend 구조

## build command

`ttsc-typia build.go`는 다음 순서로 동작한다.

1. flags parse
2. `driver.LoadProgram(cwd, tsconfig, options)`
3. diagnostics 출력
4. typia call sites 수집
5. 각 call site를 native transformer로 바꿔 `RewriteSet`에 추가
6. `prog.EmitAll(rewrites, writeFile)`
7. cleanup과 manifest 작성

Nestia의 build command도 이 흐름을 따른다. 다만 call site 대신 다음 site를 수집한다.

- `@TypedBody`, `@EncryptedBody`, `@PlainBody`, `@TypedHeaders`, `@TypedParam`, `@TypedQuery`, `@TypedFormData.Body`
- `@TypedRoute`, `@EncryptedRoute`, `@TypedQuery.*`
- `@WebSocketRoute.*`
- controller method declaration for `OperationMetadata`
- user source의 typia call sites

## transform command

`ttsc-typia transform.go`는 두 모드를 가진다.

- `--file`: 한 파일 emit 또는 TS source transform
- project transform: 모든 source file을 `{ typescript }` JSON으로 반환

Nestia에는 project transform이 중요하다. `TtscCompiler.transform()`을 사용하는 generate command나 tests에서 transformed TypeScript source를 확인할 수 있어야 한다.

## source rewrite

typia project transform은 source text를 직접 replace한다.

- call expression node의 `Pos()`와 `End()`를 range로 사용한다.
- range는 뒤에서 앞으로 정렬해 적용한다.
- replacement는 printer output이다.
- 마지막에 TypeScript output cleanup을 수행한다.

Nestia decorator rewrite도 source transform에서는 같은 방식이 유효하다. 다만 decorator argument 추가는 AST node 전체를 printer로 다시 출력해야 하므로, TS AST printer가 decorator syntax를 안정적으로 보존하는지 별도 검증이 필요하다.

## adapter context

typia adapter는 다음 context를 구성한다.

- `Program`
- `CompilerOptions`
- `Checker`
- `Options`
- `Importer`

Nestia core transformer도 사실상 `ITypiaContext`를 확장한 `INestiaTransformContext`를 사용한다. 따라서 Go port에서도 다음을 보존한다.

- compiler options
- checker
- importer
- transform options
- diagnostics sink
- extras/config

