# Verification Plan

## 단위 검증

Go unit tests:

- plugin payload parser
- decorator path matcher
- Promise unwrap
- import registry
- source rewrite range sorting
- diagnostics formatter
- option normalization

TypeScript tests:

- transform manifest resolution
- setup wizard package mutation
- config loader compile/import bridge

## Golden transform fixtures

필수 fixture:

- `@TypedBody()` with no args
- `@TypedBody(custom)` with existing args
- `@TypedParam("id")`
- `@TypedQuery()`
- `@TypedQuery.Body()`
- `@TypedFormData.Body()`
- `@PlainBody()`
- `@TypedRoute.Get()`
- `@TypedRoute.Post()`
- `@EncryptedRoute.Post()`
- `@TypedQuery.Get()`
- `@WebSocketRoute()`
- method with `@TypedException<T>()`
- class with inherited methods
- controller with versioning/security/tags

각 fixture는 세 결과를 비교한다.

1. 기존 ts-patch transformer output
2. native `ttsc-nestia transform --output ts`
3. native `ttsc-nestia build --emit` JS output

## End-to-end 검증

명령:

```bash
pnpm build
pnpm test
pnpm --filter=./packages/cli build
pnpm --filter=./packages/sdk build
pnpm --filter=./packages/core build
```

추가 sample:

```bash
npx nestia setup
npx ttsc --noEmit
npx nestia sdk
npx nestia swagger
npx nestia e2e
```

## Tarball 검증

`pnpm package:tgz` 이후 tarball에서 확인한다.

- `@nestia/core` tarball에 `native/**` 포함
- `@nestia/sdk` transform manifest가 같은 source를 resolve
- `lib/transform.js`와 `lib/transform.d.ts` 존재
- `package.json` exports가 built output을 가리킴
- consumer install 후 `npx ttsc prepare` 성공

## Regression gates

merge 전 필수 gate:

- ttsc single transform backend 충돌 없음
- `ts-patch install` 문자열이 setup path에서 사라짐
- SDK CLI가 `ts-node.register({ plugins })`에 의존하지 않음
- generated SDK output diff가 의도한 범위 안에 있음
- typia 일반 call과 Nestia decorator가 같은 project에서 동시에 변환됨

