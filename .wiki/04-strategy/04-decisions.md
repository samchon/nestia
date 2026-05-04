# 설계 결정 기록

## D1. 포팅 시작점은 compiler sidecar다

결정: runtime package 재작성보다 `@nestia/core`/`@nestia/sdk` transformer의 native sidecar 전환을 먼저 한다.

근거:

- ttsc와 typia@next의 현재 진화 방향과 일치한다.
- Nestia의 성능/정확성 핵심은 decorator transform과 SDK metadata transform이다.
- fetcher/e2e/editor/migrate는 compiler host 병목을 풀지 못한다.

## D2. 단일 transform host를 전제로 한다

결정: Nestia native transform은 typia/core/sdk 협업을 하나의 native backend에서 처리하도록 설계한다.

근거:

- `ttsc`는 서로 다른 transform native binary 동시 실행을 금지한다.
- Nestia는 typia programmers와 metadata factory에 의존한다.
- consumer project는 일반 typia call과 Nestia decorator를 같이 쓴다.

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

