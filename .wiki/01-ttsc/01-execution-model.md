# ttsc 실행 모델

## CLI와 programmatic API

사용자가 보는 CLI는 다음과 같다.

- `ttsc`: project build/check/watch/prepare/clean
- `ttsx`: TypeScript direct execution with checking and transform

library host가 보는 API는 `TtscCompiler`다.

```ts
new TtscCompiler({
  cwd,
  tsconfig,
  binary,
  plugins,
  cacheDir,
  env,
}).transform();
```

Nestia의 `NestiaConfigLoader`는 현재 `ts-node.register()`를 사용한다. Go 포팅에서는 이 부분이 `TtscCompiler.compile()` 또는 `ttsx` equivalent execution으로 바뀌어야 한다. `ts-node`는 `ttsc` native plugin을 실행하지 않는다.

## build path

`runBuild` 계열의 책임은 다음이다.

1. project config resolve
2. native plugin load/build
3. check stage plugin 실행
4. transform/build stage plugin 또는 TypeScript-Go normal build 실행
5. output stage plugin 적용
6. diagnostics/result 정규화

Go sidecar가 compiler backend라면 Program creation과 emit을 sidecar가 소유한다.

## transform path

`transformProjectInMemory.ts`는 source-to-source API다.

- plugin이 없으면 native compiler의 `api-transform` command를 실행한다.
- plugin이 있으면 check plugin을 먼저 실행한다.
- transform plugin이 있으면 single transform host를 강제한다.
- sidecar stdout은 `{ "typescript": { ... } }` JSON이어야 한다.

이 지점이 Nestia 포팅의 가장 중요한 제약이다.

## 단일 transform host 제약

`ttsc`는 여러 transform stage plugin이 있더라도 native binary path가 하나여야 한다.

즉 다음 조합은 위험하다.

```json
{
  "plugins": [
    { "transform": "typia/lib/transform" },
    { "transform": "@nestia/core/lib/transform" },
    { "transform": "@nestia/sdk/lib/transform" }
  ]
}
```

각 plugin이 서로 다른 native command를 반환하면 `ttsc: multiple transform native backends cannot share one source-to-source pass`에 걸린다.

Nestia는 이 문제를 다음 중 하나로 풀어야 한다.

1. `@nestia/core`와 `@nestia/sdk`가 같은 native source command를 반환한다.
2. Nestia native command가 typia call rewrite까지 포함하고, Nestia setup은 별도 `typia/lib/transform` entry를 넣지 않는다.
3. `typia` 쪽 manifest와 Nestia manifest가 같은 통합 backend를 반환할 수 있도록 별도 협업 protocol을 만든다.

현재 `ttsc` 철학을 따르면 2번 또는 3번이 맞다. 1번만으로는 user project 안의 일반 `typia.*<T>()` call을 같이 처리하지 못한다.

