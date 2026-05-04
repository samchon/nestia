# 조사 범위와 정독 기준

사용자 요청의 범위는 세 저장소 전체와 현재 저장소다.

- `ttsc`: `/home/samchon/github/samchon/ttsc`
- `typia@next`: `/home/samchon/github/samchon/typia@next`
- `typia`: `/home/samchon/github/samchon/typia`
- `nestia@next`: `/home/samchon/github/samchon/nestia@next`

## 이번 위키의 근거 범위

이번 문서는 다음 축을 우선 근거로 삼았다.

- `ttsc` README, guide docs, JS host, plugin loader/cache, native driver, native CLI
- `typia@next`의 `GO-MIGRATION-INSTRUCTION.md`, ttsc plugin manifest, native `ttsc-typia` command, adapter, setup/generate wizard
- `typia` TypeScript 원본과 `typia@next` native core/transform의 파일 대응성
- `nestia@next`의 package manifest, setup/configurator, core transformer/programmers, sdk transformer/analyzer/generator, migrate entry

## 정직한 상태 표시

이 위키는 포팅 착수 전 의사결정을 위한 1차 지식대백과다. `git ls-files` 기반 전체 inventory와 대표 핵심 파일의 실제 내용을 근거로 작성했다. 다만 `typia@next`의 benchmark 결과물, 테스트 fixture, generated output 같은 대량 산출물은 현재 상태와 라인 수를 inventory로 잡았고, 포팅 설계의 authoritative source는 source/docs/tree correspondence로 제한했다.

향후 실제 포팅에 들어가기 전에는 `typia@next/GO-MIGRATION-INSTRUCTION.md`의 방식처럼 Nestia도 파일별 문서를 만들어야 한다. 특히 `packages/core/src/**/*.ts`, `packages/sdk/src/**/*.ts`, `packages/cli/src/**/*.ts`, `packages/migrate/src/**/*.ts`는 각 파일마다 다음 항목이 있어야 한다.

- 원본 경로
- native 대응 경로
- public/exported surface
- 내부 알고리즘
- 사용하는 TypeScript-Go shim
- typia native 의존점
- 상태: `TS_ORIGINAL`, `GO_PLANNED`, `GO_PORTED`, `VERIFIED`

## 조사 명령 기록

대표적으로 사용한 명령은 다음과 같다.

```bash
git ls-files | wc -l
git ls-files | awk '{ ... wc -l ... }'
git ls-files 'packages/*/src/**'
rg -n "ts-patch|typia/lib/transform|compilerOptions.plugins|transform"
sed -n '1,260p' README.md
sed -n '1,260p' docs/README.md
sed -n '1,280p' packages/ttsc/src/TtscCompiler.ts
sed -n '1,260p' packages/typia/src/transform.ts
sed -n '1,320p' packages/typia/native/cmd/ttsc-typia/build.go
sed -n '1,320p' packages/core/src/transformers/*.ts
sed -n '1,380p' packages/sdk/src/transformers/SdkOperationProgrammer.ts
```

