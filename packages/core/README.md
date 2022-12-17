# Nestia Core
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/typia.svg)](https://www.npmjs.com/package/@nestia/core)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

```bash
npx nestia setup
```

Super-easy and super-fast validator decorators for NestJS.

`@nestia/core` is a transformer library of NestJS, supporing super-easy and super-fast validation decorators, by using [typia](https://github.com/samchon/typia). Comparing validation speed with `class-validator`, `@nestia/core` is maximum **15,000x times faster** and it even supports every TypeScript types.

Furthremore, `@nestia/core` can use pure interface typed DTO with **only one line**. Therefore, it does not require any extra dedication like defining JSON schema (`@nestjs/swagger`) or using class definition with decorator function calls (`class-validator`). Just enjoy **super-easy** and **super-fast** through with pure TypeScript types.

```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * `TypedRoute.Post()`: safe `JSON.stringify()` with type validation.
     *
     * Furthermore, its 10x times faster than native `JSON.stringify()` function.
     */
    @TypedRoute.Post()
    public async store(
        /**
         * Super-fast request body validator through `TypedBody()`. 
         *
         * It also requires only one line.
         */
        @TypedBody() input: IBbsArticle.IStore
    ): Promise<IBbsArticle>;
}
```

```typescript
/** 
 * You don't need any extra dedication like:
 * 
 *   - `@nestjs/swagger`: JSON schema definition
 *   - `class-transformer`: class definition with decorator function class
 *
 * Just enjoy the pure interface type as DTO
 */
export interface IBbsArticle {
    /**
     * @format uuid
     */
    id: string;
    writer: string;
    title: string;
    content: string;
    created_at: string;
}
export namespace IBbsArticle {
    export interface IStore {
        writer: string;
        title: string;
        content: string;
    }
}
```

![Benchmark](https://github.com/samchon/typia/raw/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz/images/is.svg)

> Measured on [Intel i5-1135g7, Surface Pro 8](https://github.com/samchon/typia/tree/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz#is)
>
> `@nestia/core` is providing super-easy and super-fast validator by wrapping [typia](https://github.com/samchon/typia)





## Setup
### Setup Wizard
```bash
# setup both @nestia/core and @nestia/sdk
npx nestia setup

# setup @nestia/core only
npx nestia setup
```

When you run `npx nestia setup` command, all installation and configuration processes would be automatically done. If you want to setup `@nestia/core` only, run `npx @nestia/core setup` command instead.

After the setup has been completed, you can compile your backend server code by using `ttsc` command. If you want to run your TypeScript file directly through `ts-node`, add `-C ttypescript` argument like below:

```bash
npx ttsc
npx ts-node -C ttypescript src/index.ts
```

> In the automated setup process, you can specialize package manager like `yarn` instead of `npm` by adding `--module yarn` argument. You also can specialize transformation compiler by using [`--module ts-patch`](https://github.com/nonara/ts-patch) argument. Default compiler is [`ttypescrpit`](https://github.com/cevek/ttypescript).
>
> ```bash
> npx nestia setup \
>    --compiler (ttypescript|ts-patch) 
>    --module (npm|pnpm|yarn)
>
> npx nestia setup
> npx nestia setup --module yarn
> npx nestia setup --compiler ts-patch
> ```

### NPM Packages
If you want to install and configure manually, install `@nestia/core` module first.

Also, you need additional devDependencies to compile the TypeScript code with transformation. Therefore, install those all libraries `typescript`, `ttypescript` and `ts-node`. Inform that, `ttypescript` is not mis-writing. Do not forget to install the `ttypescript`.

```bash
npm install --save @nestia/core

# ENSURE THOSE PACKAGES ARE INSTALLED
npm install --save-dev typescript
npm install --save-dev ttypescript
npm install --save-dev ts-node
```

### `tsconfig.json`
After the installation, you've to configure `tsconfig.json` file like below.

Add a property transform and its value as `@nestia/core/lib/transform` into `compilerOptions.plugins` array. Also, do same thing on `typia/lib/transform` value. When configuring, I recommend you to use the strict option, to enforce developers to distinguish whether each property is nullable or undefindable.

```json
{
  "compilerOptions": {
    "strict": true,
    "plugins": [
      { 
        "transform": "@nestia/core/lib/transform",
        // "validate": "assert", // "assert" | "is" | "validate"
        // "stringify": "is", // null | "stringify" | "assert" | "is" | "validate"
      },
      { "transform": "typia/lib/transform" }
    ]
  }
}
```

Also, you can configure additional properties like `validate` and `stringify`. 

Through the `validate` property, you can specialize which validation algorithm of [typia](https://github.com/samchon/typia) to be used. Default is `assert` function and if you choose `is` function instead, the validation speed would be extremely faster, but any reason why would be provided when wrong typed data comes. Otherwise you select `validate` function, its validation speed would be slower, but most detailed reasons would be provided.

By specializing `stringify` property, you can specialize which JSON stringify function of [typia](https://github.com/samchon/typia) would be used. Default is `assert`, but if choose `null` instead, it would be replaced to `JSON.stringify()` function. Otherwise you configure it as `stringify`, fastest logic would be used, but unexpected behavior would be happend when wrong typed data comes.

```typescript
// RUNTIME VALIDATORS
export function is<T>(input: unknown | T): boolean; // returns boolean
export function assert<T>(input: unknown | T): T; // throws TypeGuardError
export function validate<T>(input: unknown | T): IValidation<T>; // detailed

// FAST STRINGIFY FUNCTIONS
export function stringify<T>(input: T): string; // unsafe, but very fast
export function assertStringify<T>(input: T): string; // assert + stringify
export function isStringify<T>(input: T): string | null; // is + stringify
export function validateStringify<T>(input: T): IValidation<T>; // validate +
```




## Features
```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * `TypedRoute.Post()`: safe `JSON.stringify()` with type validation.
     *
     * Furthermore, its 10x times faster than native `JSON.stringify()` function.
     */
    @TypedRoute.Post()
    public async store(
        /**
         * Super-fast request body validator through `TypedBody()`. 
         *
         * It also requires only one line.
         */
        @TypedBody() input: IBbsArticle.IStore
    ): Promise<IBbsArticle>;
}
```

### TypedBody
`TypedBody` is a decorator function for `application/json` typed request body. 

Also, it supports super-fast validation pipe, which is 15,000x times faster then ordinary `nest.Body()` decorator using `class-validator`.

### TypedRoute
`TypedRoute` is a decorator function for `application/json` typed reponse body.

Also, it supports safe and fast JSON stringify pipe, which is maximum 10x times faster than native `JSON.stringify()` function and it is even type safe.

### Encryption
`@nestia/core` supports special decorator functions `EncryptedBody` and `EncryptedRout`. They're almost same with [TypedBody](#typedbody) and [TypedRoute](#typedroute), but there's only one thing different - it encrypts JSON data through AES-128/256 algorithm.

  - AES-128/256
  - CBC mode
  - PKCS #5 Padding
  - Base64 Encoding





## Appendix
### Nestia SDK
```bash
npx nestia swagger
npx nestia sdk
```

When you adapt this `@nestia/core`, you can't use `@nestjs/swagger` more. Instead, I support `@nestia/sdk`, which is much more stable and powerful then before. Through this `@nestia/sdk` module, you can generate `swagger.json` and even generating SDK library is possible.

For reference, SDK (Software Development Kit) library means a library which can be utilized by TypeScript client developer conveniently. When you generate SDK library through `@nestia/sdk`, `@nestia/sdk` will analyze your backend server code and generate codes like below:

#### `BbsArticlesController.ts`
```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * `TypedRoute.Post()`: safe `JSON.stringify()` with type validation.
     *
     * Furthermore, its 10x times faster than native `JSON.stringify()` function.
     */
    @TypedRoute.Post()
    public async store(
        /**
         * Super-fast request body validator through `TypedBody()`. 
         *
         * It also requires only one line.
         */
        @TypedBody() input: IBbsArticle.IStore
    ): Promise<IBbsArticle>;
}
```

#### `src/functional/bbs/articles/index.ts`
```typescript
import { Fetcher, IConnection } from "@nestia/fetcher";
import { IBbsArticle } from "../../../structures/IBbsArticle";

export function store(
    connection: api.IConnection, 
    input: IBbsArticle.IStore
): Promise<IBbsArticle> {
    return Fetcher.fetch(
        connection,
        store.ENCRYPTED,
        store.METHOD,
        store.path(),
        input
    );
}
export namespace store {
    export const METHOD = "POST" as const;
    export function path(): string {
        return "/bbs/articles";
    }
}
```

#### SDK utilization code
```typescript
import api from "@bbs-api";
import typia from "typia";

export async function test_bbs_article_store(connection: api.IConnection) {
    const article: IBbsArticle = await api.functional.bbs.articles.store(
        connection,
        {
            name: "John Doe",
            title: "some title",
            content: "some content",
        }
    );
    typia.assert(article);
    console.log(article);
}
```

### Typia
> https://github.com/samchon/typia
> 
> `@nestia/core` is wrapping `typia` and the `typia` is:

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/typia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/typia.svg)](https://www.npmjs.com/package/typia)
[![Downloads](https://img.shields.io/npm/dm/typia.svg)](https://www.npmjs.com/package/typia)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/typia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/typia/wiki)

```typescript
// RUNTIME VALIDATORS
export function is<T>(input: unknown | T): input is T; // returns boolean
export function assert<T>(input: unknown | T): T; // throws TypeGuardError
export function validate<T>(input: unknown | T): IValidation<T>; // detailed

// STRICT VALIDATORS
export function equals<T>(input: unknown | T): input is T;
export function assertEquals<T>(input: unknown | T): T;
export function validateEquals<T>(input: unknown | T): IValidation<T>;

// JSON
export function application<T>(): IJsonApplication; // JSON schema
export function assertParse<T>(input: string): T; // type safe parser
export function assertStringify<T>(input: T): string; // safe and faster
    // +) isParse, validateParse 
    // +) stringify, isStringify, validateStringify
```

`typia` is a transformer library of TypeScript, supporting below features:

  - Super-fast Runtime Validators
  - Safe JSON parse and fast stringify functions
  - JSON schema generator

All functions in `typia` require **only one line**. You don't need any extra dedication like JSON schema definitions or decorator function calls. Just call `typia` function with only one line like `typia.assert<T>(input)`.

Also, as `typia` performs AOT (Ahead of Time) compilation skill, its performance is much faster than other competitive libaries. For an example, when comparing validate function `is()` with other competitive libraries, `typia` is maximum **15,000x times faster** than `class-validator`.
