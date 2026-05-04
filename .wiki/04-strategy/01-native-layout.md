# Native Package Layout 제안

## 단일 backend

권장 native command:

```text
packages/core/native/
  go.mod
  cmd/ttsc-nestia/
    main.go
    build.go
    transform.go
    plugins.go
  adapter/
    program.go
    collect_decorators.go
    collect_typia.go
    printer.go
    diagnostics.go
    imports.go
  core/
    options/
    programmers/
    transformers/
  sdk/
    analyses/
    transformers/
    structures/
    utils/
```

`@nestia/sdk`는 `@nestia/core`에 의존하므로 `@nestia/sdk/lib/transform` manifest도 core package의 같은 native source를 resolve할 수 있다. 이 경우 SDK package 내부 상대 경로가 아니라 `require.resolve("@nestia/core/package.json", { paths: [context.projectRoot] })`를 기준으로 core package root를 찾아야 한다. 단, package 경계를 더 깨끗하게 하고 싶다면 장기적으로 `@nestia/compiler` package를 새로 만들 수 있다.

## manifest files

`packages/core/src/transform.ts`:

- `createTtscPlugin(context)` 추가
- package root resolve
- `native/cmd/ttsc-nestia` source 반환
- transition 동안 기존 default transformer는 별도 legacy path로 격리

`packages/sdk/src/transform.ts`:

- 같은 source를 반환
- name은 `nestia-sdk` 또는 `@nestia/sdk`
- plugin config는 `--plugins-json`에 보존

## Go module

`go.mod`는 typia native와 ttsc driver를 참조해야 한다.

예상 module/import 관계:

```text
module github.com/samchon/nestia/packages/core/native

require github.com/samchon/ttsc/packages/ttsc
require github.com/samchon/typia/packages/typia/native

import github.com/samchon/typia/packages/typia/native/core/...
import github.com/samchon/typia/packages/typia/native/transform/...
import github.com/microsoft/typescript-go/shim/...
```

`ttsc` source build가 `go.work` overlay를 구성하므로 monorepo 개발과 npm install 환경을 모두 검증해야 한다. 특히 typia native source를 npm dependency에서 어떻게 공급할지 결정해야 한다. 선택지는 typia native module을 package dependency로 그대로 참조하는 방식, Nestia compiler package 안에 tested snapshot을 vendoring하는 방식, 또는 `ttsc` overlay를 확장하는 방식이다. 이 결정이 닫히기 전에는 Go build contract가 완성되지 않는다.

## plugin payload parser

`plugins.go`는 `--plugins-json`을 읽어 다음 config를 정규화한다.

```go
type NestiaPluginPlan struct {
  EnableCore bool
  EnableSdk bool
  EnableTypia bool
  CoreOptions CoreTransformOptions
  SdkOptions SdkTransformOptions
  TypiaOptions typiaadapter.PluginOptions
}
```

이 plan이 모든 transform pass의 source of truth가 되어야 한다.

## adapter responsibilities

adapter는 TypeScript-Go shim의 거친 API를 Nestia 원본 구조에 맞게 감싼다.

- source file text와 path normalization
- decorator list abstraction
- method/parameter declaration abstraction
- call expression abstraction
- signature declaration source path match
- type-to-type-node 대응
- Promise unwrap
- import alias registry
- diagnostics builder
- printer output cleanup

이 adapter가 빈약하면 ported programmer가 TypeScript-Go shim detail에 직접 오염된다.
