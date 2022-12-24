# Nestia Core
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Super-fast validation decorators for NestJS.

  - 15,000x faster request body validation
  - 10x faster JSON response, even type safe
  - Do not need DTO class definition, just fine with interface

`@nestia/core` is a transformer library of NestJS, supporting super-fast validation decorators, by wrapping [typia](https://github.com/samchon/typia). Comparing validation speed with `class-validator`, [typia](https://github.com/samchon/typia) is maximum **15,000x times faster** and it is even much safer.

Furthermore, `@nestia/core` can use pure interface typed DTO with **only one line**. With `@nestia/core`, you don't need any extra dedication like defining JSON schema (`@nestjs/swagger`), or using class definition with decorator function calls (`class-validator`). Just enjoy the superfast decorators with pure TypeScript type.

```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import type { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * Store a new content.
     * 
     * @param inupt Content to store
     * @returns Newly archived article
     */
    @TypedRoute.Post() // 10x faster and safer JSON.stringify()
    public async store(
        @TypedBody() input: IBbsArticle.IStore // super-fast validator
    ): Promise<IBbsArticle>; 
        // do not need DTO class definition, 
        // just fine with interface
}
```




## Setup
### Boilerplate Project
```bash
npx nestia start <directory>
```

Just run above command, then boilerplate project would be constructed.

### Setup Wizard
```bash
# setup both @nestia/core and @nestia/sdk
npx nestia setup

# setup @nestia/core only
npx @nestia/core setup
```

When you run `npx nestia setup` command, all installation and configuration processes would be automatically done. If you want to setup `@nestia/core` only, run `npx @nestia/core setup` command instead.

After the setup has been fully completed, you can compile your backend server code by using `ttsc` command. If you want to run your TypeScript file directly through `ts-node`, add `-C ttypescript` argument like below:

```bash
npx ttsc
npx ts-node -C ttypescript src/index.ts
```

Also, you can specify package manager or target `tsconfig.json` file like below:

```bash
npx @nestia/core setup --manager npm
npx @nestia/core setup --manager pnpm
npx @nestia/core setup --manager yarn

npx @nestia/core setup --project tsconfig.json
npx @nestia/core setup --project tsconfig.test.json
```

### Manual Setup
If you want to install and configure `@nestia/core` manually, read [Guide Documents - Setup](https://github.com/samchon/nestia/wiki/Setup).

<!-- ### NPM Packages
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
``` -->




## Features
```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * Store a new content.
     * 
     * @param inupt Content to store
     * @returns Newly archived article
     */
    @TypedRoute.Post() // 10x faster and safer JSON.stringify()
    public async store(
        @TypedBody() input: IBbsArticle.IStore // supoer-fast validator
    ): Promise<IBbsArticle>;
}
```

### TypedBody
`TypedBody()` is a decorator function of `application/json` typed request body.

Also, it supports super-fast validation pipe, which is maximum **15,000x times faster** then `nest.Body()` function using `class-validator`.

### TypedRoute
`TypedRoute` is a set of decorator functions for `application/json` typed response body.

Also, it supports safe and fast JSON stringify function pipe, which is maximum 10x times faster than native `JSON.stringify()` function. Furthermore, it is **type safe** through validation.

  - `TypedRoute.Get()`
  - `TypedRoute.Post()`
  - `TypedRoute.Put()`
  - `TypedRoute.Patch()`
  - `TypedRoute.Delete()`

### Encryption
`@nestia/core` supports special decorator functions `EncryptedBody` and `EncryptedRout`. They're almost same with [TypedBody](#typedbody) and [TypedRoute](#typedroute), but there's only one thing different - it encrypts JSON data through AES-128/256 algorithm.

  - AES-128/256
  - CBC mode
  - PKCS #5 Padding
  - Base64 Encoding

### Comment Tags
You can enhance DTO type validation by writing comment tags.

If you want to know about it detaily, visit [Guide Documents of typia](https://github.com/samchon/typia/wiki/Runtime-Validators#comment-tags).

```typescript
export interface IBbsArticle {
    /**
     * @format uuid
     */
    id: string;

    writer: IBbsArticle.IWriter;

    /**
     * @minItems 1
     */
    contents: IBbsArticle.IContent[];
}
export namespace IBbsArticle {
    export interface IWriter {
        /**
         * @minLength 3
         */
        name: string;

        /**
         * @format email
         */
        email: string;

        /**
         * @pattern ^0[0-9]{7,16}
         */
        mobile: string;

        /**
         * @minimum 18
         */
        age: number;
    }
}
```




## Appendix
### Nestia SDK
```bash
npx nestia swagger
npx nestia sdk
```

Automatic *SDK* and *Swagger* generator for `@nestia/core`.

With `@nestia/core`, you can boost up validation speed maximum **15,000x times faster**. However, as `@nestjs/swagger` does not support `@nestia/core`, you can't generate swagger documents from `@nestjs/swagger` more.

Instead, I provide you `@nestia/sdk` module, which can generate not only swagger documents, but also SDK (Software Development Kit) library.

#### `BbsArticlesController.ts`
```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * Store a new article.
     * 
     * @param input content to store
     * @returns new article
     */
    @TypedRoute.Post()
    public async store(
        @TypedBody() input: IBbsArticle.IStore
    ): Promise<IBbsArticle>;
}
```

#### `src/functional/bbs/articles/index.ts`
```typescript
import { Fetcher, IConnection } from "@nestia/fetcher";
import { IBbsArticle } from "../../../structures/IBbsArticle";

/**
 * Store a new content.
 * 
 * @param input content to store
 * @returns new article
 */
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
