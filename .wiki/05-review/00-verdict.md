# 위키 심층 리뷰 최종 판정

## 회의 결과

2026-05-04에 5명 참여자 전원이 `.wiki/**/*.md` 전체를 읽고 회의했다. 회의록은 `conventions/00-session-minutes.md`에 남겼다.

최종 판정은 다음과 같다.

- 방향성: 승인
- 포팅 구현 착수 기준: 아직 NOT READY
- 사용자 요청의 “모든 소스코드 line-by-line 지식대백과” 기준: 아직 NOT READY
- 다음 작업: 구현이 아니라 Phase 0 지식대백과 보강

## 유지할 결론

Nestia Go 포팅은 runtime/fetcher/migrate 재작성부터 시작하면 안 된다. 시작점은 `@nestia/core/lib/transform`, `@nestia/sdk/lib/transform`, `typia/lib/transform`의 compiler execution model 전환이다.

`ttsc`는 서로 다른 transform native backend를 하나의 source-to-source pass에 함께 넣지 못한다. 따라서 Nestia는 `core/sdk/typia`를 하나의 native transform host 안에서 공존시키는 정책을 먼저 결정해야 한다.

## 반려할 주장

현재 `.wiki`가 이미 포팅 착수 가능한 완성 지식대백과라는 주장은 반려한다.

이유:

- 파일별 ledger가 없다.
- `packages/core/src`, `packages/sdk/src`, `packages/cli/src` 180개 source 파일의 per-file 분석이 없다.
- typia native module 공급 방식이 결정되지 않았다.
- `typia/lib/transform` migration 정책이 결정되지 않았다.
- SDK config execution bridge가 `TtscCompiler.compile()` 한 단어로만 쓰였고, in-memory output materialization 또는 `ttsx` bridge 중 어느 쪽인지 닫히지 않았다.
- package/tarball native source inclusion gate가 너무 늦게 배치되어 있었다.
- TypeScript-Go printer가 Nestia decorator syntax와 metadata literal을 안정적으로 보존하는지 실증 fixture가 없다.

## 회의 합의

1. `core/sdk/typia` single-host 공존 정책은 Phase 0/1 선결정이다.
2. setup wizard에서 `ts-patch`를 제거하는 작업은 native skeleton, tarball inclusion, `ttsc prepare` smoke 이후에 해야 한다.
3. `@nestia/sdk/lib/transform`이 `@nestia/core` native source를 공유한다면 `@nestia/core/package.json` resolution 기준을 문서화하고 검증해야 한다.
4. typia native source 공급 방식은 별도 결정 항목이다.
5. `TtscCompiler.compile()`은 in-memory output을 반환하므로 SDK config import bridge에는 materialization 또는 `ttsx` bridge 설계가 필요하다.
6. migrate 자체 재작성은 후순위가 맞지만, migrate template의 legacy compiler setup은 package/setup compatibility 범위에 포함해야 한다.

