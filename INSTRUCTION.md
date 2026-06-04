# nestia@next — native ttsx 통합 마무리 지침 (새 세션용)

이 문서는 nestia core/sdk의 "native(Go) transform을 텍스트 splice에서 AST-node emit으로
전환" 작업을 **이어받아 완성**하기 위한 자족 지침이다. 브랜치는
`feat/native-ttsx-integration` (이 PR의 head).

## 1. 지금까지 된 것

- nestia core/sdk native를 typia가 한 것과 동일한 노드 경로로 통합했고 **빌드는 green**이다.
  - **core**: `packages/core/native/transform/build.go`가
    `prog.EmitWithPluginTransformers([]driver.PluginTransform{typiaTransform, coreTransform}, writeFile)`로
    emit한다 (텍스트 RewriteSet/EmitAllRaw 제거). 신규 `transform/node_transform.go`,
    수정 `core_transform.go` / `core_querify.go` / `typia_fast.go`.
  - **sdk**: `packages/sdk/native/sdk/register.go`가 `EmitTransform`(emit-phase AST transformer)를
    구현한다.
- 빌드 검증은 `go.work`를 **로컬 ttsc + 로컬 typia**로 임시 전환해서 했고, 커밋에는 원복했다
  (CI는 tgz/go.mod로 의존을 공급하므로 로컬 go.work는 커밋하지 않는다).

## 2. CI가 실패하는 진짜 이유 (해결 대상)

`nestia.yml` CI가 다음으로 실패한다:
```
transform/node_transform.go:47: importer.SetEmitContext undefined (type *programmers.ImportProgrammer has no field or method SetEmitContext)
transform/typia_fast.go:34: too many arguments in call to nativetransform.Transform
```

원인은 **nestia가 의존하는 typia 버전이 옛날**이라서다. nestia 코드는 typia의
`ImportProgrammer.SetEmitContext` 와 `transform.Transform(prog, opts, extras, ec)`(4-arg, ec 추가)를
쓰는데, `packages/core/native/go.mod` 와 `packages/sdk/native/go.mod`의 typia 의존이
`github.com/samchon/typia/packages/typia/native v0.0.0-20260520144235-368b47d0ea16` (그 변경 **이전**)이다.
`nestia.yml`은 ttsc만 tarball override로 갈아끼우고, typia(go module)는 안 바꾼다.

> namespace 회귀(`export namespace`가 런타임 undefined)는 ttsc 쪽 `SetParentInChildrenUnset`으로
> 이미 고쳤고 ttsc tarball로 자동 반영되므로 nestia에서 따로 할 일은 없다.

## 3. 해야 할 일 (순서대로)

### 3-1. typia 안정 확인
- typia 작업 브랜치: `/home/samchon/github/samchon/typia` `feat/native-ttsx-integration`.
- typia.yml CI가 green인지 확인 (`gh run list --workflow typia.yml`). typia에 미해결 버그가 있으면
  그게 green이 된 뒤 그 커밋을 의존하는 게 안전하다.
- typia가 API를 제공하는지 확인:
  `git -C ../typia show feat/native-ttsx-integration:packages/typia/native/core/programmers/ImportProgrammer.go | grep -n SetEmitContext`
  `git -C ../typia show feat/native-ttsx-integration:packages/typia/native/transform/transform.go | grep -n "func Transform"`

### 3-2. nestia go.mod의 typia 의존을 최신으로 올린다
typia 작업 브랜치는 npm/go publish가 안 됐으므로 **커밋 pseudo-version**으로 받는다.
typia 최신 커밋 해시 확인: `git -C ../typia rev-parse feat/native-ttsx-integration`.
```
cd packages/core/native
GOFLAGS=-mod=mod GOPROXY=https://proxy.golang.org,direct \
  go get github.com/samchon/typia/packages/typia/native@<해시 또는 feat/native-ttsx-integration>
cd ../../sdk/native
GOFLAGS=-mod=mod GOPROXY=https://proxy.golang.org,direct \
  go get github.com/samchon/typia/packages/typia/native@<해시 또는 feat/native-ttsx-integration>
```
(GOPROXY가 github 접근 가능해야 한다. 네트워크가 막혀 있으면 typia를 먼저 publish하거나,
nestia.yml에 "typia 작업 브랜치 clone + go.mod replace" 단계를 추가하는 방향으로 — 아래 3-5 참고.)

### 3-3. 로컬 빌드 검증
`go.work`를 로컬 ttsc+typia로 임시 전환해 검증한다 (typia의 `packages/typia/native/go.work`를
그대로 참고: `use ( . ../../../../ttsc/packages/ttsc ../../../../ttsc/packages/ttsc/shim/* ../../../../typia/packages/typia/native )`).
```
cd packages/core/native && GOPROXY=off go build ./...   # green
cd packages/sdk/native  && GOPROXY=off go build ./...    # green
```
검증 후 `git checkout` 으로 go.work/go.mod의 로컬 전환을 **원복**한다 (go.mod의 typia 버전 업만 남긴다).

### 3-4. 커밋 & 푸시
go.mod / go.sum (typia 버전 업)만 커밋하고 `feat/native-ttsx-integration`에 푸시한다. go.work(로컬 전환)는 커밋하지 않는다.

### 3-5. CI 검증
ttsc 레포에 커밋을 푸시하면(또는 nestia.yml run을 rerun하면) nestia.yml이 다시 돈다.
`gh run list --workflow nestia.yml`로 모든 job(sdk/go/e2e/transform-options/migrate)이 green인지 확인한다.
만약 3-2의 GOPROXY 네트워크가 막혀 go.mod 버전 업이 불가능하면, `ttsc/.github/workflows/nestia.yml`에
typia 작업 브랜치를 clone하고 nestia go.mod를 그 경로로 replace하는 단계를 추가한다
(typia.yml이 typia를 ttsc 옆에 clone하는 패턴 참고). 이건 임시이며 typia/nestia 정식 merge 시 되돌린다.

## 4. (선택, CI green 이후) 텍스트 경로 미사용 코드 삭제
typia가 한 것처럼(typia 커밋 167047339 참고) nestia의 죽은 텍스트 splice를 지운다. 단 grep으로
LIVE caller가 없는 것만:
- core: `transform/rewrite.go`의 `nativeRewriteSet` 및 build.go의 텍스트 잔재.
- sdk: `sdk/sdk_transform.go`의 `nestiaSDKBuildRewriteSet`.
삭제 후 `go build ./...` + `go test ./...` green 유지.

## 5. 참고 (typia가 한 노드 경로 패턴)
`git -C ../typia log --oneline feat/native-ttsx-integration` 중:
- `47d88ccb` ImportProgrammer emit-context namespace 모드 (SetEmitContext)
- `6e113bad` transform.Transform + FileTransformer에 EmitContext 배선
- `ca22ad06` cmd build.go가 EmitWithPluginTransformers로 emit
- `bb9ed119` normalizeSyntheticTokens를 ec 경로에 적용
- `13952c7f` FileTransformer가 두 TransformerError 타입 모두 recover
- `167047339` 텍스트 경로 미사용 코드 삭제

ttsc 쪽 핵심 fix:
- `EmitWithPluginTransformers` / `EmitTransformPlugin` / `PluginTransform=func(ec,sf)*SourceFile`
- `guardedEmitResolver` (const-enum inliner가 plugin 노드에 panic하는 것 방어)
- `SetParentInChildrenUnset` (synthetic 노드만 parent 배선 — namespace export drop 방지)
