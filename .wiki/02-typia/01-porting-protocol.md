# typia 포팅 프로토콜에서 차용할 규칙

## copy-first

Nestia 포팅을 시작할 때는 빈 Go 파일을 설계하지 않는다. 원본을 먼저 native tree에 복사하고, 파일별로 번역한다.

권장 seed:

```bash
mkdir -p packages/core/native packages/sdk/native packages/cli/native
rsync -a packages/core/src/ packages/core/native/core/
rsync -a packages/sdk/src/ packages/sdk/native/sdk/
rsync -a packages/cli/src/ packages/cli/native/cli/
```

실제 작업에서는 `--delete` 사용 전 native tree에 이미 변환된 `.go`가 없는지 확인해야 한다.

## 파일별 wiki

Nestia도 다음 위치에 파일별 포팅 문서를 둔다.

```text
.wiki/packages/core/.../{filename}.md
.wiki/packages/sdk/.../{filename}.md
.wiki/packages/cli/.../{filename}.md
```

각 문서 필수 항목:

- original TS path
- native copy path
- exported identifiers
- transformer/programmer/analyzer role
- TypeScript compiler API usage
- TypeScript-Go shim replacement
- typia native dependency
- diagnostics behavior
- status

## 상태 값

권장 상태:

- `TS_ORIGINAL`: 원본 확인 전
- `READ`: 원본 파일 의미 확인
- `GO_PLANNED`: Go 대응 shim/API 계획 완료
- `GO_PORTED`: `.go` 변환 완료
- `PARITY_TESTED`: golden test 또는 fixture pass
- `VERIFIED`: package-level build/test 통과

## test immutable

Nestia의 테스트와 fixture는 포팅 기준이다. 테스트를 단순화하거나 fixture를 native 구현에 맞게 바꾸면 안 된다.

허용되는 변경:

- test runner가 `ts-patch` 대신 `ttsc`를 사용하도록 하는 infrastructure 전환
- setup wizard expected output이 `ttsc`/`@typescript/native-preview` 기준으로 바뀌는 경우

허용되지 않는 변경:

- decorator 동작 기대치 삭제
- generated SDK output 축소
- validation/stringify mode 일부 제거
- WebSocket route validation 생략

