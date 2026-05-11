# CLI Ledger

`packages/cli/src`는 Go native backend 자체가 아니라 consumer setup을 `ttsc` 시대에 맞게 바꾸는 접점이다. 핵심은 `ts-patch install` 삽입을 제거하고, `typia/lib/transform` auto-discovery 충돌을 막는 setup mutation이다.

| 파일 | 라인 | 판정 | export | TS API | typia/API | 진단 | native/조치 |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| `packages/cli/src/NestiaSetupWizard.ts` | 91 | `setup-bridge` | `NestiaSetupWizard` | - | `typia` install | - | `ts-patch`, `ts-node`, `prepare` mutation 제거. `ttsc`, `@typescript/native-preview` 설치. |
| `packages/cli/src/NestiaStarter.ts` | 42 | `cli-keep-ts` | `NestiaStarter` | - | - | - | CLI dispatch 유지. |
| `packages/cli/src/NestiaTemplate.ts` | 38 | `cli-keep-ts` | `NestiaTemplate` | - | - | - | template download/copy 유지. |
| `packages/cli/src/index.ts` | 66 | `cli-keep-ts` | - | - | - | - | public CLI module surface 유지. |
| `packages/cli/src/internal/ArgumentParser.ts` | 124 | `cli-keep-ts` | `ArgumentParser` | - | - | `throw Error` | argument grammar 유지. `--project` 기본값만 `ttsc` smoke와 같이 검증. |
| `packages/cli/src/internal/CommandExecutor.ts` | 9 | `cli-keep-ts` | `CommandExecutor` | - | - | - | command runner 유지. |
| `packages/cli/src/internal/FileRetriever.ts` | 23 | `cli-keep-ts` | `FileRetriever` | - | - | - | template/source fetch 유지. |
| `packages/cli/src/internal/PackageManager.ts` | 92 | `cli-keep-ts` | `PackageManager`, `Package` | - | - | `throw Error` | install command composer 유지. ttsc/native-preview package 추가를 검증. |
| `packages/cli/src/internal/PluginConfigurator.ts` | 126 | `setup-bridge` | `PluginConfigurator` | - | `typia/lib/transform` entry 처리 | `throw Error` | `@nestia/core/lib/transform`를 native manifest entry로 유지하고, `typia/lib/transform`은 옵션 이관 후 `enabled:false` tombstone으로 남긴다. |

## 구현 규칙

1. `nestia setup`은 더 이상 `ts-patch install`을 `prepare`에 넣지 않는다.
2. 기존 project에 `typia/lib/transform`이 있으면 `functional`, `numeric`, `finite`, `undefined` 옵션을 `@nestia/core/lib/transform`의 `typia` sub-config로 복사한다.
3. 같은 project에 `typia` package가 direct dependency로 남으면 `ttsc` package auto-discovery가 `typia` native backend를 다시 추가할 수 있다. 이를 막기 위해 explicit `{ "transform": "typia/lib/transform", "enabled": false }` tombstone을 남긴다.
4. `@nestia/sdk/lib/transform`은 runtime SDK generation을 선택한 경우만 둔다. 단, `@nestia/core`와 같은 native source를 반환해야 한다.

