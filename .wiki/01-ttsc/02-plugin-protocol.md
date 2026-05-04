# ttsc Plugin Protocol

## manifest

live code 기준 manifest는 단순하다.

```ts
export interface ITtscPlugin {
  name: string;
  source: string;
  stage?: "transform" | "check" | "output";
}
```

예전 guide 문서에는 `native.source` descriptor가 남아 있으나 현재 loader는 `source: string`을 직접 요구한다. Nestia 문서와 구현은 live code를 따라야 한다.

## binary command

native binary는 stage와 host 호출에 맞춰 command를 구현해야 한다. 모든 plugin이 모든 command를 구현해야 하는 것은 아니다. 아래는 stage별 host contract다.

- `check`: check stage plugin과 `--noEmit` compiler backend가 사용한다.
- `transform`: source-to-source transform stage가 사용한다.
- `build`: emit을 소유하는 compiler backend가 사용한다.
- `output`: output stage plugin이 emitted file마다 사용한다.
- `version`, `help`: host 필수 contract는 아니지만 운영과 진단을 위해 권장한다.

`typia@next`의 `ttsc-typia`는 이 command dispatcher를 이미 갖추고 있다. Nestia도 `ttsc-nestia` 같은 단일 command를 만들고, command별 의미를 명확히 해야 한다.

## `--plugins-json`

`ttsc`는 sidecar에 ordered plugin payload를 `--plugins-json`으로 넘긴다.

payload에는 적어도 다음 정보가 들어간다.

- plugin name
- stage
- original config entry

Nestia는 이 payload에서 다음을 읽어야 한다.

- `@nestia/core/lib/transform` config의 `validate`, `stringify`, 기타 extras
- `@nestia/sdk/lib/transform` 존재 여부
- `typia/lib/transform` config의 `functional`, `numeric`, `finite`, `undefined`
- plugin order

`typia@next`는 현재 tsconfig text를 regex로 읽어 typia option을 뽑는다. Nestia는 option 수가 많고 core/sdk/typia 협업이 필요하므로 `--plugins-json`을 우선 source of truth로 삼아야 한다.

## diagnostics

diagnostics는 TypeScript diagnostics처럼 file/line/column/code/message를 가져야 한다. `ttsc` driver에는 rich diagnostics 출력 path가 있으므로 Nestia sidecar도 가능한 한 `driver.NewLintDiagnostic` 또는 같은 shape로 오류를 만들어야 한다.

Nestia에서 diagnostics가 중요한 지점:

- `strictNullChecks` 미설정
- 잘못된 decorator argument
- `TypedParam` field 누락
- `GET`/`HEAD` body 금지
- wildcard path 미지원 warning
- WebSocketRoute parameter contract 위반
- typia metadata validation 실패

## cache와 배포

source plugin은 consumer project에서 lazy build된다. 따라서 Nestia package에 포함되어야 하는 것은 native source tree와 JS manifest다.

배포 시 확인할 점:

- `files`에 `native/**` 포함
- `publishConfig.exports`가 built JS manifest와 type file을 가리킴
- `source`가 package root에서 안정적으로 resolve됨
- `lib` 제외 규칙 때문에 source plugin scratch copy에서 build output과 source가 섞이지 않음
- monorepo dev와 npm package install 양쪽에서 `go.mod`를 찾을 수 있음
