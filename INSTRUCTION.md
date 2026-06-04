# nestia@next — native ttsx 통합 마무리 지침 (새 세션용)

이 문서는 nestia core/sdk의 "native(Go) transform을 텍스트 splice에서 AST-node emit으로
전환" 작업을 **이어받아 완성**하기 위한 자족 지침이다. 브랜치는
`feat/native-ttsx-integration` (이 PR의 head).

typia 작업 브랜치가 이번 세션에 더 진화했다. 핵심은 `ImportProgrammer`가
`core/programmers`에서 `core/context`로 이동한 것이다. 그래서 go.mod 버전 bump만으로는
부족하고 nestia 코드의 import 경로도 같이 고쳐야 한다.

## 1. 지금까지 된 것

- nestia core/sdk native를 typia가 한 것과 동일한 노드 경로로 통합했고, **로컬 typia 기준으로
  빌드는 green**이었다.
  - **core**: `packages/core/native/transform/build.go`가
    `prog.EmitWithPluginTransformers([]driver.PluginTransform{typiaTransform, coreTransform}, writeFile)`로
    emit한다 (텍스트 RewriteSet/EmitAllRaw 제거). 신규 `transform/node_transform.go`,
    수정 `core_transform.go` / `core_querify.go` / `typia_fast.go`.
    - `typia_fast.go:34`가 `nativetransform.Transform(prog, &transformOptions, extras, ec)(sf)`로
      4-arg(ec 추가) 시그니처를 부른다.
    - `node_transform.go:43,47`이 `nativeprogrammers.NewImportProgrammer(...)` 후
      `importer.SetEmitContext(ec)`를 부른다.
  - **sdk**: `packages/sdk/native/sdk/register.go`가 `EmitTransform`(emit-phase AST transformer)를
    구현한다. sdk는 `ImportProgrammer`를 직접 쓰지 않으므로 sdk 쪽 코드 수정은 없고 go.mod bump만
    하면 된다.
- 빌드 검증은 `go.work`를 **로컬 ttsc + 로컬 typia**로 임시 전환해서 했고, 커밋에는 원복했다
  (CI는 tgz/go.mod로 의존을 공급하므로 로컬 go.work는 커밋하지 않는다).

## 2. CI가 실패하는 진짜 이유 (해결 대상)

`nestia.yml` CI가 실패하는 근본 원인은 **nestia가 의존하는 typia 버전이 옛날**이라서다.
`packages/core/native/go.mod:12` 와 `packages/sdk/native/go.mod:11`의 typia 의존이
`github.com/samchon/typia/packages/typia/native v0.0.0-20260520144235-368b47d0ea16`
(2026-05-20, AST-integration emit 도입 **이전**)에 묶여 있고, `nestia.yml`은 ttsc만 tarball
override로 갈아끼우며 typia(go module)는 안 바꾼다.

옛날 typia에는 nestia 코드가 쓰는 다음 API가 없어 컴파일이 깨진다:
- `transform.Transform`의 4-arg(ec 추가) 시그니처 — too many arguments.
- `ImportProgrammer.SetEmitContext` 메서드 — undefined.

여기에 더해 최신 typia는 `ImportProgrammer`를 **다른 패키지로 옮겼다**. 그래서 go.mod만 올리면
이번에는 import 경로가 안 맞아 깨진다. 그 코드 수정까지 3-3에 포함된다.

> namespace 회귀(`export namespace`가 런타임 undefined)는 ttsc 쪽 `SetParentInChildrenUnset`으로
> 이미 고쳤고 ttsc tarball로 자동 반영되므로 nestia에서 따로 할 일은 없다.

## 3. 해야 할 일 (순서대로)

### 3-1. typia 안정 확인

- typia 작업 브랜치: `/home/samchon/github/samchon/typia` `feat/native-ttsx-integration`.
  현재 HEAD: `2f6d664764774fc96dee8d2271d40e2b7fd9c2e6`.
- typia.yml CI가 green인지 확인 (`gh run list --workflow typia.yml`). typia에 미해결 버그가 있으면
  그게 green이 된 뒤 그 커밋을 의존하는 게 안전하다.
- typia가 API를 제공하는지 확인 (모두 확인됨):
  - `ImportProgrammer`는 이제 **context 패키지**에 있다:
    `git -C ../typia show feat/native-ttsx-integration:packages/typia/native/core/context/ImportProgrammer.go | grep -n "func NewImportProgrammer\|func (p \*ImportProgrammer) SetEmitContext"`
    (생성자 `NewImportProgrammer`, 메서드 `SetEmitContext`, 타입 `ImportProgrammer` / `ImportProgrammer_IOptions` 모두 패키지 `context`).
  - `transform.Transform`은 4-arg:
    `git -C ../typia show feat/native-ttsx-integration:packages/typia/native/transform/transform.go | grep -n "func Transform"`
    → `func Transform(program *driver.Program, options *nativecontext.ITransformOptions, extras nativecontext.ITypiaContext_Extras, ec *shimprinter.EmitContext) TransformFactory`.
  - `AssertProgrammer` / `IsProgrammer` / `ValidateProgrammer` 등 **검증기 프로그래머는 여전히
    core/programmers에 남아 있다**. 이동한 것은 `ImportProgrammer` 한 묶음뿐이다.

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
nestia.yml에 "typia 작업 브랜치 clone + go.mod replace" 단계를 추가하는 방향으로 — 아래 3-6 참고.)

### 3-3. nestia 코드 수정: ImportProgrammer 패키지 이동 반영 (core 전용, sdk는 없음)

typia가 `ImportProgrammer` / `NewImportProgrammer` / `ImportProgrammer_IOptions` /
`SetEmitContext`를 `core/programmers`에서 `core/context`로 옮겼다. nestia core의 세 파일이
이 심볼들을 `nativeprogrammers.*`로 참조하므로 `nativecontext.*`로 바꿔야 한다. 단 같은 파일들이
`AssertProgrammer` 등 **여전히 programmers에 남아 있는** 검증기도 `nativeprogrammers.*`로 쓰므로
alias를 통째로 갈면 안 된다. ImportProgrammer 묶음만 `nativecontext`로 옮긴다.

- `packages/core/native/transform/node_transform.go`
  - 이 파일은 typia에서 `nativeprogrammers`만 import한다(line 8). 그 import 한 줄을
    `nativecontext "github.com/samchon/typia/packages/typia/native/core/context"`로 교체.
  - line 43 `nativeprogrammers.NewImportProgrammer(nativeprogrammers.ImportProgrammer_IOptions{...})`
    → `nativecontext.NewImportProgrammer(nativecontext.ImportProgrammer_IOptions{...})`.
  - line 47 `importer.SetEmitContext(ec)`는 메서드 호출이라 그대로 둔다(이동만으로 자동 해결).

- `packages/core/native/transform/core_querify.go`
  - import에 `nativecontext "github.com/samchon/typia/packages/typia/native/core/context"`를 추가한다
    (이 파일엔 아직 없다, line 9-12 참고). `nativeprogrammers` import는 그대로 둔다(AssertProgrammer 등 사용).
  - line 82 / 104 / 132의 함수 시그니처 `importer *nativeprogrammers.ImportProgrammer`
    → `importer *nativecontext.ImportProgrammer` (3곳).
  - 본문의 `nativeprogrammers.AssertProgrammer` / `IsProgrammer` / `ValidateProgrammer`(line 88,110,138 등)는
    그대로 둔다.

- `packages/core/native/transform/core_transform.go`
  - 이 파일은 이미 `nativecontext`를 import한다(line 20). import 추가 불필요.
  - `nativeprogrammers.ImportProgrammer` 타입 참조와 `nativeprogrammers.NewImportProgrammer` /
    `nativeprogrammers.ImportProgrammer_IOptions` 호출만 `nativecontext.*`로 바꾼다. 해당 라인:
    59, 458, 782, 845, 911, 924, 933, 947, 1081, 1092, 1113, 1137(반환부 ITypiaContext는 이미
    nativecontext), 1139.
  - `nativeprogrammers.AssertProgrammer` / `IsProgrammer` / `ValidateProgrammer`(line 856~899,
    1083~1088 등)는 그대로 둔다. `nativeprogrammers` import도 그대로 유지된다.

확인용 grep (수정 후 ImportProgrammer 관련 `nativeprogrammers` 참조가 0이어야 한다):
```
grep -rn 'nativeprogrammers\.\(ImportProgrammer\b\|NewImportProgrammer\|ImportProgrammer_IOptions\)' packages/core/native
```

> 참고: `SetEmitContext`를 nestia가 직접 부르는 곳은 `node_transform.go:47` 한 곳이다(메서드라 패키지
> 이동만으로 해결). typia 내부에서는 `FileTransformer`가 `importer.SetEmitContext(ec)` 후
> `ITypiaContext.Emit`에 ec를 담는 패턴을 쓰지만, nestia core는 자체 `nestiaCoreTypiaContext`에서
> `Importer`만 채우고 ec-mode importer를 외부에서 주입받으므로(`node_transform.go`가 한 번
> `SetEmitContext` 호출) 그 구조를 그대로 둔다. `ITypiaContext`에 새로 생긴 `Emit` 필드는 nestia가
> 채울 필요 없다(typia 검증기 Write 경로가 importer만 소비).

### 3-4. 로컬 빌드 검증

`go.work`를 로컬 ttsc+typia로 임시 전환해 검증한다 (typia의 `packages/typia/native/go.work`를
그대로 참고: `use ( . ../../../../ttsc/packages/ttsc ../../../../ttsc/packages/ttsc/shim/* ../../../../typia/packages/typia/native )`).
```
cd packages/core/native && GOPROXY=off go build ./...   # green
cd packages/sdk/native  && GOPROXY=off go build ./...    # green
```
검증 후 `git checkout` 으로 go.work의 로컬 전환을 **원복**한다 (go.mod의 typia 버전 업과 3-3 코드
수정만 남긴다).

### 3-5. 커밋 & 푸시

다음을 커밋하고 `feat/native-ttsx-integration`에 푸시한다:
- go.mod / go.sum (core + sdk, typia 버전 업)
- 3-3의 코드 수정 (core 세 파일)

go.work(로컬 전환)는 커밋하지 않는다.

### 3-6. CI 검증

ttsc 레포에 커밋을 푸시하면(또는 nestia.yml run을 rerun하면) nestia.yml이 다시 돈다.
`gh run list --workflow nestia.yml`로 모든 job(sdk/go/e2e/transform-options/migrate)이 green인지 확인한다.
만약 3-2의 GOPROXY 네트워크가 막혀 go.mod 버전 업이 불가능하면, `ttsc/.github/workflows/nestia.yml`에
typia 작업 브랜치를 clone하고 nestia go.mod를 그 경로로 replace하는 단계를 추가한다
(typia.yml이 typia를 ttsc 옆에 clone하는 패턴 참고). 이건 임시이며 typia/nestia 정식 merge 시 되돌린다.

## 4. (선택, CI green 이후) 텍스트 경로 미사용 코드 삭제

3-3 코드 수정과 CI green이 끝난 뒤에만 검토한다. typia가 한 것처럼 nestia의 죽은 텍스트 splice를
지운다. 단 grep으로 LIVE caller가 없는 것만:
- core: `transform/rewrite.go`의 `nativeRewriteSet` 및 `core_transform.go`의 텍스트 잔재
  (`collectNestiaCoreSourceRewriteMap` / `collectNestiaCoreBuildRewrites` / `nestiaCoreParameterArguments`
  텍스트 변환부). 단 `transform` / `check` 서브커맨드의 source-to-source 경로가 아직 이들을 쓰는지
  먼저 확인하라.
- sdk: `sdk/sdk_transform.go`의 `nestiaSDKBuildRewriteSet`.
삭제 후 `go build ./...` + `go test ./...` green 유지.

## 5. 참고 (typia가 한 노드 경로 패턴)

이번 세션 typia 변경의 핵심:
- `ImportProgrammer`를 `core/programmers` → `core/context`로 이동(패키지 `context`),
  private 필드 `ec_` → `emit_`. public API(`NewImportProgrammer` / `SetEmitContext` /
  `Default` / `Instance` / `Namespace` / `Type` / `ToStatements`)는 시그니처 동일.
- `ITypiaContext`(`core/context/ITypiaContext.go`): 죽은 `Printer`/`Transformer` 필드 제거.
  `Emit *shimprinter.EmitContext`(legacy `ts.TransformationContext` 대응, original threading 출처) 추가,
  `Importer`는 `*ImportProgrammer` 포인터.
- `transform.Transform`이 4-arg(`prog, opts, extras, ec`). `FileTransformer`가 `EmitContext`를 받아
  `importer.SetEmitContext(ec)` 후 `context.Emit = ec`, 그리고 `context.Emit != nil`이면
  `ec.NewNodeVisitor`로 순회(아니면 `shimast.NewNodeVisitor`) — `export namespace` 등이
  `exports.X = X = {}`로 정상 lowering.
- `cmd/ttsc-typia`에 `build` / `check` / `transform` 서브커맨드 모두 존재. `transform`은 노드 경로
  source-to-source(JSON envelope; `--file` / `--tsconfig` / `--cwd` / `--out` / `--output=js|ts`,
  기본 `ts` 또는 `TYPIA_TTSC_TRANSFORM_OUTPUT` env).

ttsc 쪽 핵심 fix:
- `EmitWithPluginTransformers` / `EmitTransformPlugin` / `PluginTransform=func(ec,sf)*SourceFile`
- `guardedEmitResolver` (const-enum inliner가 plugin 노드에 panic하는 것 방어)
- `SetParentInChildrenUnset` (synthetic 노드만 parent 배선 — namespace export drop 방지)
