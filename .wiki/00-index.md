# Nestia Go 포팅 지식대백과

이 `.wiki`는 `ttsc`, `typia@next`, `typia`, 그리고 현재 `nestia@next`의 구조를 근거로 Nestia의 Go 포팅 방향을 정리한 작업 지식베이스다.

핵심 결론은 단순하다. Nestia의 Go 포팅은 런타임 데코레이터나 fetcher부터 바꾸는 일이 아니라, `ts-patch` 기반 TypeScript transformer를 `ttsc` native sidecar로 옮기는 일에서 시작해야 한다. 또한 `ttsc`의 transform stage는 서로 다른 native binary를 동시에 허용하지 않으므로, `typia`, `@nestia/core`, `@nestia/sdk` 변환은 장기적으로 하나의 native transform host 안에서 협업해야 한다.

## 문서 구조

- `00-ledger/`: 읽기 범위, 파일 수, 라인 수, 조사 근거, 후속 정독 기준
- `01-ttsc/`: `ttsc`의 구동 원리, 플러그인 프로토콜, Nestia가 따라야 할 철학
- `02-typia/`: `typia` TypeScript 원본과 `typia@next` Go 포팅의 대응 방식
- `03-nestia/`: 현재 `nestia@next` 패키지와 transformer/generator 구조
- `04-strategy/`: Nestia Go 포팅 마스터 플랜, native layout, 단계, 검증 계획

## 현재 판단

1. `ttsc`는 TypeScript-Go를 감싸는 JS host이며, 실제 Program/Checker/emit/transform 작업은 Go binary가 수행한다.
2. `typia@next`는 `../typia/packages/core/src`와 `../typia/packages/transform/src`를 1:1 파일 대응으로 Go에 옮겼고, JS package surface는 얇은 `createTtscPlugin()` manifest로 바뀌었다.
3. `nestia@next`는 아직 `ts-patch`와 `ts-node`에 묶여 있다. `@nestia/core/lib/transform`과 `@nestia/sdk/lib/transform`은 TypeScript transformer 함수를 export한다.
4. Nestia 포팅의 첫 번째 병목은 변환기 자체가 아니라 실행 모델이다. `NestiaSetupWizard`, `PluginConfigurator`, `NestiaConfigLoader`, CLI boot path가 `ttsc`/`ttsx` 실행 모델로 먼저 바뀌어야 한다.
5. `@nestia/core` 변환기는 request/response decorator 인자에 typia 기반 validator/stringifier plan을 주입한다.
6. `@nestia/sdk` 변환기는 controller method에 `OperationMetadata` decorator를 주입하고, CLI는 그 runtime reflection 결과를 SDK/Swagger/E2E generator로 넘긴다.

## 포팅 원칙

- TypeScript 원본과 Go 포트는 파일 단위로 추적 가능해야 한다.
- 기존 공개 API, decorator 이름, config option 이름, generated SDK surface는 보존한다.
- `ttsc`의 plugin contract를 우회하지 않는다.
- `typia@next`처럼 copy-first, per-file ledger-first, test-immutable 방식으로 진행한다.
- Nestia 전용 hard-coding으로 특정 테스트나 특정 DTO 이름을 통과시키지 않는다.

