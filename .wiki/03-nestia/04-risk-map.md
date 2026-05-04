# Nestia Go 포팅 Risk Map

## R1. 여러 transform backend 충돌

현재 Nestia setup은 typia/core/sdk transformer를 모두 등록한다. ttsc에서는 transform stage native binary가 하나여야 한다.

대응:

- 통합 native backend 설계
- `--plugins-json` 기반 mode dispatch
- setup wizard에서 중복 backend를 만들지 않도록 plugin config 재설계

## R2. ts-node 실행 경로

SDK CLI는 config를 `ts-node`로 실행한다. ttsc native transform이 적용되지 않으면 `OperationMetadata` decorator가 주입되지 않는다.

대응:

- `TtscCompiler.compile()` 기반 temp compile/import
- 또는 `ttsx` 실행 bridge
- config loader golden test

## R3. decorator printer fidelity

Nestia는 decorator argument와 method decorator를 수정한다. printer가 comment, decorator order, modifier order, import order를 흔들 수 있다.

대응:

- source transform golden test
- JS emit golden test
- decorator-only fixtures
- TypeScript 5 decorator API와 legacy decorator shape 양쪽 확인

## R4. typia native dependency drift

Nestia core programmers는 typia internals에 깊게 의존한다. typia native port의 API가 TS 원본과 다르면 Nestia가 흔들린다.

대응:

- typia native API wrapper를 Nestia adapter에서 흡수
- typia `MetadataFactory`, programmers, `ImportProgrammer` 사용 지점별 compatibility ledger
- typia update에 맞춘 integration tests

## R5. runtime reflection과 compile-time metadata의 결합

SDK generator는 compile-time transformer가 주입한 decorator를 runtime reflection으로 읽는다. 이 결합이 깨지면 generator는 정상적으로 실행되어도 route metadata가 비어 있을 수 있다.

대응:

- sample controller를 compile/import한 뒤 reflection metadata를 직접 assert
- `NestiaSdkApplication` end-to-end golden output
- wildcard path warning, versioning, security, exception metadata fixtures

## R6. setup migration compatibility

기존 사용자는 `ts-patch`, `ts-node`, `typescript` 중심 설정을 가지고 있다.

대응:

- setup wizard가 legacy `ts-patch install`과 `typia patch` 제거
- `ttsc`, `@typescript/native-preview` 설치
- 기존 plugin option을 보존해 새 manifest config로 변환
- migration note 작성

