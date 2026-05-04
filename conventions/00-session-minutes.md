# Nestia Go 포팅 위키 심층 리뷰 회의록

## 2026-05-04 세션 시작

- 의장: Codex Main
- 요청: `.wiki` 전체 지식대백과 심층 리뷰, 5명 팀 에이전트 끝장토론, 회의록 작성, 결론 도출
- 범위: `.wiki/**/*.md` 전체 23개 문서
- 원칙: 범위 분담 금지. 모든 참여자는 `.wiki` 전체를 읽고 이해한 뒤 발언한다. 관점만 다르게 둔다.
- 회의 전/중 기록 위치: `conventions/`
- 최종 결론 반영 위치: 세션 종료 후 `.wiki/05-review/`

## 참여자

1. Main: 의장, 회의록, 통합 결론
2. Agent A: `ttsc` 실행 모델 및 plugin protocol 검증 관점
3. Agent B: `typia@next`/`typia` 포팅 대응성 검증 관점
4. Agent C: `nestia@next` 현재 architecture 검증 관점
5. Agent D: 포팅 전략, phase, release risk 검증 관점
6. Agent E: 반대자 관점, 오점/과장/누락 탐지

## 회의 진행 로그

- 00:00 Main: 회의록을 개설했다. 범위 분담 없이 모든 참여자에게 전체 `.wiki`를 읽게 한다.
- 00:01 Main: 직접 재검토에서 첫 쟁점을 확인했다. `.wiki/01-ttsc/02-plugin-protocol.md`의 native command 목록은 `build/check/transform/version/help`만 적혀 있는데, `ttsc` output stage contract를 고려하면 `output` command도 명시해야 한다.
- 00:02 Agent D: READY. `.wiki`의 큰 결론은 맞다. Nestia 포팅의 시작점은 runtime/fetcher/migrate 재작성이 아니라 `@nestia/core/lib/transform`, `@nestia/sdk/lib/transform`, `typia/lib/transform`의 compiler execution model 전환이다.
- 00:03 Agent D: 실제 `ttsc`는 transform stage native backend가 여러 개면 `"ttsc: multiple transform native backends cannot share one source-to-source pass"`로 막는다. 따라서 single native transform host 결론은 유지해야 한다.
- 00:04 Agent D: 단, `.wiki/04-strategy/02-phases.md`의 Phase 1 순서가 위험하다. manifest 전환, setup wizard의 `ttsc` 전환, `ts-patch` 제거를 native skeleton보다 먼저 묶으면 missing native source를 가리키는 상태로 consumer build가 깨질 수 있다.
- 00:05 Agent D: package/tarball 검증도 너무 늦다. 현재 `@nestia/core`와 `@nestia/sdk` package `files`에는 `native/**`가 없다. `native/**` 포함, `source` resolve, packed install smoke는 Phase 7이 아니라 Phase 1~2 hard gate가 되어야 한다.
- 00:06 Agent D: `@nestia/sdk/lib/transform`이 core package의 native source를 참조하려면 SDK package 내부 기준이 아니라 `require.resolve("@nestia/core/package.json")` 기준으로 core root를 찾아야 한다.
- 00:07 Agent D: `SDK OperationMetadata`부터 포팅한다는 결론은 맞지만 쉬운 단계가 아니다. `MetadataFactory`, `MetadataCollection`, `CommentFactory`, `DtoAnalyzer`, `LiteralFactory`, JSDoc tag, import 분석을 먼저 작은 표면으로 검증하는 단계라고 표현해야 정확하다.
- 00:08 Agent D: Phase 3의 `Reflect.getMetadata("nestia/OperationMetadata", ...)` 검증은 config execution bridge 없이 완결되기 어렵다. 최소한 임시 ttsc compile/import harness를 Phase 3에 포함하거나 Phase 6 일부를 앞당겨야 한다.
- 00:09 Agent D: `ts-node` risk는 SDK ConfigLoader뿐 아니라 `packages/core/src/decorators/internal/load_controller.ts`의 `detect-ts-node` 경로에도 있다. Phase 0 ledger에 명시해야 한다.
- 00:10 Agent B: READY. `.wiki`의 대전제는 맞다. `ttsc`의 transform path뿐 아니라 build emit path도 여러 compiler native backend를 막는다.
- 00:11 Agent B: `typia@next`의 manifest와 `typia` TS 원본 대 native Go tree 1:1 경로 대응은 실제로 확인된다.
- 00:12 Agent B: 문제는 typia native Go module 공급 방식이 닫히지 않았다는 점이다. `ttsc` source plugin build는 scratch copy에서 `node_modules`를 제외하며 overlay replacement도 현재 `ttsc` module 중심이다. Nestia가 typia native source를 npm dependency에서 어떻게 안정적으로 Go build에 공급할지 결정해야 한다.
- 00:13 Agent B: 기존 Nestia setup은 `typia/lib/transform`을 항상 추가한다. single native host 결론을 구현하려면 setup migration이 typia entry를 제거/치환할지, typia manifest가 같은 backend를 반환할지 결정해야 한다.
- 00:14 Agent B: typia API 의존성 목록은 좋지만 API compatibility ledger가 부족하다. `MetadataFactory`, `JsonMetadataFactory`, `LiteralFactory`, `CommentFactory`, `ImportProgrammer`, 각 programmer별로 Go export 직접 호출 가능 여부와 adapter wrapper 필요 여부를 내려 적어야 한다.
- 00:15 Agent E: READY. 단, 회의 참여 준비가 READY이지, 위키 자체는 NOT READY라고 판정한다.
- 00:16 Agent E: `.wiki/00-ledger/00-scope.md`가 스스로 대표 핵심 파일과 inventory 기반이라고 밝힌다. 이것은 정직하지만 사용자 기준의 `line by line`, 모든 소스코드, 단 하나의 오점 없음에는 미달한다.
- 00:17 Agent E: Phase 0 완료 기준은 `core/sdk/cli` 전체 문서화인데 현재 `.wiki/packages/**` 파일별 문서가 0개다. 실제 `packages/core/src`, `packages/sdk/src`, `packages/cli/src` tracked source는 180개다.
- 00:18 Agent E: `ttsc` inventory가 drift되었다. 현재 `ttsc` checkout은 30,826 total lines인데 `.wiki/00-ledger/01-current-inventory.md`는 30,561 lines를 적고 있다.
- 00:19 Agent E: single backend 결론은 맞지만 `typia/lib/transform`을 빼는지 shared backend로 합의하는지 아직 열린 문제다. 확정 설계처럼 말하면 과장이다.
- 00:20 Agent E: TypeScript-Go printer가 decorator syntax, modifier order, JSDoc, metadata literal을 안정적으로 보존한다는 실증이 없다. 이것은 설계 핵심 리스크다.
- 00:21 Agent E: typia API 목록의 명칭 정밀도가 떨어진다. 예를 들어 실제 `TypedBodyProgrammer`는 `AssertCloneProgrammer`가 아니라 `MiscAssertCloneProgrammer`, `MiscValidateCloneProgrammer`를 import한다.
- 00:22 Main: Agent E의 inventory drift와 API 명칭 지적을 직접 확인했다. `ttsc` 현재 라인 수는 30,826이고, `TypedBodyProgrammer`는 `MiscAssertCloneProgrammer`, `MiscValidateCloneProgrammer`를 사용한다.
- 00:23 Agent A: READY. 위키의 큰 결론에는 찬성한다. 다만 Nestia native port의 0번 결정은 `core/sdk/typia`가 한 transform host에서 어떻게 공존하는가다.
- 00:24 Agent A: Phase 1에서 core/sdk manifest 전환을 먼저 하고 typia 통합을 Phase 5로 미루면, 기존 setup이 `typia/lib/transform`, `@nestia/core/lib/transform`, `@nestia/sdk/lib/transform` 세 개를 동시에 넣기 때문에 `ttsc`에서 즉시 충돌한다.
- 00:25 Agent A: `.wiki/01-ttsc/02-plugin-protocol.md`의 “native binary는 build/check/transform/version/help를 구현해야 한다”는 표현은 과하다. `ttsc` stage model은 `check`, `transform`, `output`이고 모든 plugin이 모든 command를 갖는 것은 아니다. Nestia 통합 backend에는 build/check/transform이 사실상 필요하지만 version/help는 운영상 권장이다.
- 00:26 Agent A: `TtscCompiler.compile()`로 temp output에 compile/import한다고 쓴 결론은 약하다. public `compile()`은 in-memory output을 반환하고 내부 temp dir은 정리된다. SDK config import bridge는 in-memory output을 별도 temp dir에 materialize할지, `ttsx` 실행 bridge를 library화할지 명확히 골라야 한다.
- 00:27 Agent A: Go dependency 표기가 package import와 module require를 섞고 있다. `typia@next` module은 `github.com/samchon/typia/packages/typia/native`이고 `core`/`transform`은 하위 import path다.
- 00:28 Agent A: `--plugins-json` source of truth 결론은 맞지만, typia@next는 아직 tsconfig regex로 typia option을 읽는다. Nestia 통합 rewrite를 하려면 `--plugins-json` 기반 typia option adapter를 새 contract로 확정해야 한다.
- 00:29 Agent C: READY. 위키의 큰 방향, 즉 Nestia Go 포팅은 runtime 재작성보다 `ttsc` native compiler sidecar 전환이 먼저이고 typia/core/sdk transform은 단일 backend에서 협업해야 한다는 결론에 찬성한다.
- 00:30 Agent C: `@nestia/core` transformer 구조 설명과 `@nestia/sdk` OperationMetadata/runtime reflection 설명은 실제 소스와 맞다.
- 00:31 Agent C: 그러나 현재 `.wiki`는 전략 결론은 강하지만 실행 ledger가 약하다. `packages/*/src/**`는 258파일 25,056라인인데 현재 파일별 포팅 문서가 없다.
- 00:32 Agent C: SDK OperationMetadata를 먼저 잡는 전략은 타당하지만 runtime reflection 검증은 config/controller를 변환된 상태로 실행해야 하므로 config bridge를 Phase 6까지 미루면 Phase 3 검증이 반쪽이 된다.
- 00:33 Agent C: migrate를 3차 물결로 미루는 결론은 compiler core 관점에서는 맞지만 migrate template이 이미 `ts-patch`, `ts-node`, 기존 transform plugin을 포함한다. generated project UX 관점에서 migrate asset 정리는 Phase 7 package/setup compatibility scope에 포함되어야 한다.
- 00:34 Agent C: path matching risk를 더 강하게 써야 한다. 현재 core transformer는 `@nestia/core/lib/decorators`와 `packages/core/src/decorators` substring에 의존한다. native port에서는 package root resolution, pnpm symlink, published d.ts 경로 fixture를 고정해야 한다.

## 끝장토론

- 00:35 Main: 모든 참여자의 공통 합의는 “single native transform host 결론은 맞다”이다.
- 00:36 Agent A: 그렇다. 하지만 이 결정을 Phase 5로 미루면 실행 모델상 즉시 충돌한다. `core/sdk/typia` 공존 정책은 Phase 0 또는 Phase 1의 선결정이어야 한다.
- 00:37 Agent B: 동의한다. 특히 `typia/lib/transform`을 제거/치환할지, typia와 shared backend manifest를 합의할지 닫아야 한다.
- 00:38 Agent D: package/tarball도 같은 성격이다. native source가 tarball에 없으면 `createTtscPlugin()`은 설계가 아니라 설치 실패다. release gate가 아니라 초기 gate다.
- 00:39 Agent E: 더 근본적으로 현재 위키는 1차 전략 메모다. 사용자 기준의 전체 지식대백과로 승인하면 안 된다. 파일별 ledger가 없다.
- 00:40 Agent C: 파일별 ledger와 config execution bridge가 없으면 SDK OperationMetadata phase의 runtime 검증도 성립하지 않는다.
- 00:41 Main: 쟁점 정리. 승인할 것: 방향, single backend, runtime/fetcher/migrate 후순위. 반려할 것: 포팅 착수 READY 주장, Phase ordering, package/module/typia migration 미결정, line-by-line 완료 주장.
- 00:42 Agent E: 위키는 NOT READY라고 명시해야 한다. 다만 방향성은 폐기하지 말고 보강 목록으로 전환해야 한다.
- 00:43 Agent A: `TtscCompiler.compile()` 표현도 수정해야 한다. compile 결과는 in-memory이므로 config import용 materialization 또는 `ttsx` bridge 중 하나를 설계해야 한다.
- 00:44 Agent B: typia native module 공급 방식도 필수 결정이다. npm dependency의 Go source를 `ttsc` scratch build에 어떻게 안정적으로 공급할지 없으면 구현이 막힌다.
- 00:45 Agent D: Phase 1은 legacy-compatible manifest와 source resolution smoke 정도로 낮추고, setup migration은 skeleton/tarball/prepare green 이후로 미뤄야 한다.
- 00:46 Main: 최종 결론은 조건부 승인이다. “전략 방향은 승인, 현재 위키는 구현 착수 기준 NOT READY, 다음 작업은 Phase 0 보강”으로 결정한다.

## 최종 합의

1. `.wiki`의 핵심 방향은 유지한다.
2. 현재 `.wiki`는 사용자 기준의 “모든 소스코드 line-by-line 지식대백과”로는 미달이다.
3. 포팅 구현 착수 전 Phase 0 보강이 필요하다.
4. Phase 0 보강의 최우선 항목은 파일별 ledger, typia/native module 공급 방식, `typia/lib/transform` migration 정책, SDK config execution bridge, package/tarball early gate다.
5. 결론 문서는 `.wiki/05-review/`에 새로 작성한다.

## 세션 종료

- 00:47 Main: `.wiki/05-review/00-verdict.md`와 `.wiki/05-review/01-required-corrections.md`를 작성했다.
- 00:48 Main: 명백한 사실 오류도 보정했다. `ttsc` inventory를 현재 checkout 기준으로 갱신했고, plugin protocol에 `output` command를 추가했으며, typia programmer 명칭과 phase ordering을 수정했다.
- 00:49 Main: 최종 상태는 `방향성 승인 / 구현 착수 NOT READY / Phase 0 보강 필요`로 확정한다.
