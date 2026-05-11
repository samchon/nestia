# 설계 결정 기록

## D1. 포팅 시작점은 compiler sidecar다

결정: runtime package 재작성보다 `@nestia/core`/`@nestia/sdk` transformer의 native sidecar 전환을 먼저 한다.

근거:

- ttsc와 typia@next의 현재 진화 방향과 일치한다.
- Nestia의 성능/정확성 핵심은 decorator transform과 SDK metadata transform이다.
- fetcher/e2e/editor/migrate는 compiler host 병목을 풀지 못한다.

## D2. 단일 transform host를 전제로 한다

결정: Nestia native transform은 typia/core/sdk 협업을 하나의 native backend에서 처리하도록 설계한다. `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`은 같은 `@nestia/core/native/cmd/ttsc-nestia` source를 반환한다.

근거:

- `ttsc`는 서로 다른 transform native binary 동시 실행을 금지한다.
- Nestia는 typia programmers와 metadata factory에 의존한다.
- consumer project는 일반 typia call과 Nestia decorator를 같이 쓴다.

setup migration은 기존 `typia/lib/transform` option을 core config의 `typia` sub-config로 이관하고, `{ "transform": "typia/lib/transform", "enabled": false }` tombstone을 남겨 `ttsc` package auto-discovery duplicate를 막는다.

## D3. SDK OperationMetadata부터 포팅한다

결정: core decorator transform보다 SDK OperationMetadata transform을 먼저 Go로 옮긴다.

근거:

- output이 metadata decorator literal로 비교적 고정되어 있다.
- runtime reflection pipeline의 병목을 빨리 드러낸다.
- `NestiaConfigLoader` 전환 필요성을 end-to-end로 검증할 수 있다.

## D4. setup wizard는 typia@next 방식을 따른다

결정: `ts-patch` 설치/prepare 추가를 제거하고 `ttsc`, `@typescript/native-preview` 설치로 전환한다.

근거:

- Go native transformer는 `ts-patch`에서 실행되지 않는다.
- typia@next setup이 이미 같은 생태계 전환을 수행한다.
- consumer project의 `prepare` script를 compiler patch lifecycle에 묶지 않는 편이 안전하다.

## D5. generator는 transform sidecar와 분리한다

결정: `nestia sdk/swagger/e2e` 파일 생성은 native transform command에 넣지 않는다.

근거:

- `ttsc.transform()`의 contract는 TypeScript source map이다.
- SDK generator는 filesystem writer, config loader, runtime reflection pipeline이다.
- 같은 command에 섞으면 API와 diagnostics가 불명확해진다.

## D6. typia/ttsc native source는 Nestia 안에 vendoring하지 않는다

결정: `@nestia/core/native`는 typia와 ttsc Go source를 `packages/core/native/third_party`에 복제하지 않는다. release용 `go.mod`는 `github.com/samchon/typia/packages/typia/native`의 versioned Go module을 require하고, `ttsc` source plugin build가 제공하는 installed `ttsc` overlay를 사용한다. local monorepo 개발에서만 `go.work`가 `../ttsc`와 `../typia@next`를 replace한다.

근거:

- typia의 Go migration 결과물은 이미 독립 native module이며, Nestia는 그중 필요한 adapter/context/factory/programmer/metadata namespace만 import하면 된다.
- Nestia 내부 snapshot은 typia bugfix와 metadata/programmer contract를 다시 fork하는 결과가 된다.
- `../typia@next`도 typia 자체의 native module과 printer shim을 기준으로 구성되어 있으므로, Nestia는 typia module을 dependency로 삼고 자체 third_party tree를 만들지 않는다.
- `ttsc`는 source plugin build 때 installed package의 Go module과 shim overlay를 자동으로 붙인다. Nestia가 `ttsc`를 다시 복제할 이유가 없다.

구현 기준:

```go
require github.com/samchon/typia/packages/typia/native v0.0.0-20260510131441-ab7b72500dd0
replace github.com/microsoft/typescript-go/shim/printer => github.com/samchon/typia/packages/typia/native/shim/printer v0.0.0-20260510131441-ab7b72500dd0
```

`go.work`의 `../ttsc`, `../typia@next` replace는 repo-local 검증 장치이며, `ttsc` source build가 scratch directory에 복사하지 않는 파일이다.

## D7. SDK config bridge는 compile output materialization이다

결정: `NestiaConfigLoader`는 `ts-node.register({ plugins })` 대신 `TtscCompiler.compile()` result를 temp directory에 materialize하고 compiled config module을 import한다.

근거:

- `TtscCompiler.compile()`은 in-memory output record를 반환한다.
- `ttsx` bridge library화는 별도 public API 설계가 필요하므로 1차 구현 범위를 키운다.
- SDK CLI에는 config import가 필요하지 transform source map이 필요한 것이 아니다.

## D8. `@nestia/factory`는 printer 전용 AST node factory다

결정: shared factory package는 `ts.factory`를 import하거나 wrapping하지 않는다. `@nestia/sdk`와 `@nestia/migrate` generator가 호출하는 `ts.factory` method shape만 맞추고, 반환값은 TypeScript `Printer`가 source text로 되돌릴 수 있는 node object subset으로 제한한다.

범위:

- 가능: `createIdentifier`, `createTypeReferenceNode`, declaration/expression/type node 생성처럼 generator printer에 필요한 node object 구성.
- 가능: `ts.factory`와 동일한 호출 인터페이스를 유지해 migrate/sdk codegen call-site churn을 줄이는 것.
- 불가: TypeChecker, transform host, node update semantics, emit resolver, incremental compiler API 복제.

이 결정 때문에 `@nestia/factory`는 runtime dependency로 `typescript`를 두지 않는다. `typescript`는 package build를 위한 devDependency일 뿐이다.
