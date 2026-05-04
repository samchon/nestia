# Migrate와 Runtime 계층

## fetcher/e2e/editor/benchmark

이 패키지들은 compiler transformer와 직접 연결되지 않는다.

- `@nestia/fetcher`: generated SDK가 사용하는 fetch/runtime utility
- `@nestia/e2e`: E2E helper
- `@nestia/editor`: Swagger UI + editor
- `@nestia/benchmark`: benchmark utility

Go 포팅 1차 범위에서 이들을 native로 옮길 이유는 약하다. 이들은 TypeScript runtime package로 유지하고, native compiler sidecar가 생성하는 output과 compatibility를 검증한다.

## migrate

`@nestia/migrate`는 OpenAPI document를 입력받아 Nest/SDK 프로젝트 파일들을 생성한다.

핵심 entry:

- `NestiaMigrateApplication.assert`
- `NestiaMigrateApplication.validate`
- `nest(config)`
- `sdk(config)`

내부적으로 `HttpMigration`, `OpenApiConverter`, typia runtime validation을 사용한다.

Go 포팅 관점에서 `migrate`는 세 번째 물결이다.

1. core/sdk transformer native parity
2. SDK config execution/generation parity
3. migrate generator parity

`migrate`를 먼저 옮기면 compiler host 문제를 풀지 못한 채 파일 출력기만 재작성하게 된다.

