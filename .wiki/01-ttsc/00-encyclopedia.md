# ttsc 백과: 무엇인가

`ttsc`는 `typescript-go` 기반 TypeScript compiler/runtime/plugin host다. 사용자는 `ttsc`로 build/check/transform을 수행하고, `ttsx`로 type checking이 있는 TypeScript 실행을 수행한다.

`ttsc`의 철학은 다음과 같다.

- TypeScript-Go가 parse/check/emit의 authoritative compiler다.
- JavaScript layer는 project config, plugin manifest, cache, process execution을 담당한다.
- Go native backend가 Program, Checker, AST, printer, emit rewrite를 담당한다.
- plugin author는 JS hook을 작성하지 않고 Go command package를 제공한다.
- compile output과 source transform output은 구분된다.

## JS host의 역할

`packages/ttsc/src/TtscCompiler.ts`는 public programmatic API다.

- `prepare()`는 source plugin을 cache에 미리 build한다. Program을 만들지 않고 diagnostics도 돌리지 않는다.
- `clean()`은 cache root를 지운다.
- `compile()`은 emitted JS/d.ts/map을 in-memory result로 돌려준다. plugin이 있으면 temporary output directory를 사용한다.
- `transform()`은 TypeScript source map만 반환한다. JS emit, declaration, source map은 반환하지 않는다.

이 구분은 Nestia에 중요하다. `@nestia/core` decorator argument rewrite와 `@nestia/sdk` OperationMetadata injection은 source-to-source 성격이 강하고, generated SDK 파일 생성은 별도의 runtime CLI/generator 성격이다.

## plugin loader의 역할

`loadProjectPlugins.ts`는 `compilerOptions.plugins[]`를 읽고 active entry만 load한다.

허용되는 JS export shape:

- `createTtscPlugin(context)`
- `default`
- `plugin`
- module object/function 자체

반환된 plugin object는 최소한 다음을 가져야 한다.

- `name: string`
- `source: string`
- `stage?: "transform" | "check" | "output"`

`stage`가 없으면 `"transform"`이다. `transformSource`나 `transformOutput` 같은 JS hook은 거부된다.

## source plugin build

`buildSourcePlugin.ts`는 plugin의 Go source를 cache binary로 만든다.

핵심 규칙:

- `source`는 Go package directory 또는 `go.mod` file이어야 한다.
- `go.mod`는 source directory에서 최대 3단계 부모 안에 있어야 한다.
- scratch copy에서 `node_modules`, `.git`, `dist`, `build`, `vendor`, `lib`, `go.work`를 제외한다.
- `go.work`를 scratch에 새로 쓰고 `ttsc` shim overlay를 연결한다.
- cache key는 `ttsc` version, TypeScript-Go version, platform/arch, entry, source file contents로 구성한다.
- Go compiler는 `TTSC_GO_BINARY`, bundled `@ttsc/${platform}-${arch}`, local native Go, system `go` 순으로 찾는다.

Nestia는 이 모델에 맞춰 consumer가 별도 Go toolchain을 설치하지 않아도 native backend가 build되게 해야 한다.

## native driver

`packages/ttsc/driver/program.go`는 TypeScript-Go shim을 감싼 facade다.

주요 기능:

- tsconfig parse
- Program 생성
- TypeChecker lease 획득/해제
- declaration file을 제외한 source file 열람
- bind/semantic diagnostics 취합
- lint/plugin diagnostics와 TypeScript diagnostics를 같은 형식으로 출력

`packages/ttsc/driver/rewrite.go`는 emit-time rewrite를 담당한다.

- plugin이 source file과 call expression별 replacement를 `RewriteSet`에 쌓는다.
- TypeScript-Go emit의 `WriteFile` callback에서 JS output text를 가로챈다.
- output path와 source path의 suffix를 비교해 source file을 찾는다.
- call text를 찾아 replacement로 바꾼다.
- `/* @ttsc-rewritten */` sentinel로 중복 rewrite를 방지한다.

`typia@next`는 이 구조를 그대로 활용한다. Nestia도 decorator call rewrite를 할 때 source-level rewrite와 emit-time rewrite 중 어느 표면이 맞는지 명확히 골라야 한다.

