# 현재 파일 Inventory

## ttsc

Tracked files: 934
Total lines: 55,557

확장자별 주요 분포:

| 확장자 | 파일 | 라인 |
| --- | ---: | ---: |
| `.go` | 327 | 23,466 |
| `.ts` | 451 | 21,579 |
| `.md` | 33 | 3,911 |
| `.yaml` | 2 | 3,188 |
| `.json` | 58 | 1,128 |
| `.cjs` | 16 | 806 |

`ttsc`에서 의미상 핵심인 축은 네 개다.

- JS host: `packages/ttsc/src/**`
- plugin samples: `packages/banner`, `packages/strip`, `packages/paths`, `packages/lint`
- native host: `packages/ttsc/driver/**`, `packages/ttsc/utility/**`
- guide docs: `docs/**`

## typia@next

Tracked files: 2,689
Total lines: 342,523

상위 디렉터리별 주요 분포:

| 디렉터리 | 파일 | 라인 |
| --- | ---: | ---: |
| `tests` | 821 | 219,319 |
| `packages` | 708 | 76,819 |
| `website` | 147 | 19,334 |
| `benchmark` | 906 | 14,831 |
| `examples` | 74 | 2,303 |
| `experiments` | 3 | 69 |

`tests` 라인 수가 큰 이유는 native port 검증 fixture와 generated result가 포함되어 있기 때문이다. 포팅 설계의 핵심 source는 `packages/typia/native/**`, `packages/typia/src/**`, `GO-MIGRATION-INSTRUCTION.md`다.

## typia

Tracked files: 2,636
Total lines: 237,091

상위 디렉터리별 주요 분포:

| 디렉터리 | 파일 | 라인 |
| --- | ---: | ---: |
| `website` | 164 | 101,952 |
| `packages` | 688 | 66,420 |
| `tests` | 770 | 38,610 |
| `benchmark` | 906 | 14,836 |
| `examples` | 74 | 2,310 |

`typia`의 authoritative 원본은 `packages/core/src/**`와 `packages/transform/src/**`다. `typia@next`의 native 대응은 다음 명령의 비교 결과 차이가 없었다.

```bash
comm -3 \
  <(git -C ../typia ls-files 'packages/core/src/**' 'packages/transform/src/**' | sed -e 's#packages/core/src/#core/#' -e 's#packages/transform/src/#transform/#' -e 's/\.ts$/.go/' | sort) \
  <(git -C ../typia@next ls-files 'packages/typia/native/core/**' 'packages/typia/native/transform/**' | sed -e 's#packages/typia/native/##' | sort)
```

출력이 없으므로 원본 `core/transform` 트리와 native `core/transform` 트리의 파일 경로 대응은 현재 1:1이다.

## nestia@next

Tracked files: 2,493
`packages/*/src/**`: 258 files, 25,056 lines

패키지 source 분포:

| 패키지 | 파일 | 라인 |
| --- | ---: | ---: |
| `packages/sdk/src` | 97 | 9,418 |
| `packages/core/src` | 73 | 5,526 |
| `packages/migrate/src` | 41 | 4,785 |
| `packages/e2e/src` | 9 | 2,138 |
| `packages/fetcher/src` | 13 | 1,205 |
| `packages/editor/src` | 9 | 801 |
| `packages/cli/src` | 10 | 619 |
| `packages/benchmark/src` | 6 | 564 |

Go 포팅의 1차 대상은 `core`, `sdk`, `cli`다. `fetcher`, `e2e`, `editor`, `benchmark`, `migrate`는 runtime/tooling 성격이 강하므로 native transformer 안정화 이후 단계로 둔다.

Phase 0 ledger의 직접 범위는 `core`, `sdk`, `cli`의 `src/*.ts`와 `src/**/*.ts`를 합친 179개 파일, 15,546라인이다.

| 범위 | 파일 | 라인 |
| --- | ---: | ---: |
| `packages/core/src` | 73 | 5,526 |
| `packages/sdk/src` | 97 | 9,418 |
| `packages/cli/src` | 9 | 602 |
