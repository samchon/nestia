# Nestia
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Nestia is a helper library set for NestJS, supporting below features:

  - [`@nestia/core`](#nestiacore): **15,000x times faster** validation decorator using [typia](https://github.com/samchon/typia)
  - [`@nestia/sdk`](#nestiasdk): evolved **SDK** and **Swagger** generator for `@nestia/core`
  - `nestia`: just CLI (command line interface) tool

For reference, **15,000x times faster validation** means the difference in validation speed between `typia` used by `@nestia/core` and `class-validator` used by `NestJS`. If you visit `typia` repo and [read how it fast and stable](https://github.com/samchon/typia/wiki/Runtime-Validators#powerful-validator), you may understand why I've started this `nestia` project.

![Is Function Benchmark](https://github.com/samchon/typia/raw/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz/images/is.svg)

> Measured on [Intel i5-1135g7, Surface Pro 8](https://github.com/samchon/typia/tree/master/benchmark/results/11th%20Gen%20Intel(R)%20Core(TM)%20i5-1135G7%20%40%202.40GHz#is)




## Setup
### Boilerplate Project
```bash
npx nestia start <directory>
```

Just run above command, then boilerplate project would be constructed.

### Setup Wizard
```bash
npx nestia setup
```

When you want to use `nestia` in orindary project, just type above command.

All installation and configuration processes would be automatically done.

Also, you can specify package manager by `--manage` argument like below:

```bash
npx nestia setup --manager npm
npx nestia setup --manager pnpm
npx nestia setup --manager yarn
```

After the setup, you can compile `@nestia/core` utilization code by using `ttsc` ([`ttypescript`](https://github.com/cevek/ttypescript)) command. If you want to run your TypeScript file directly through `ts-node`, add `-C ttypescript` argument like below:

```bash
# COMPILE THROUGH TTYPESCRIPT
npx ttsc

# RUN TS-NODE WITH TTYPESCRIPT
npx ts-node -C ttypescript src/index.ts
```

### Manual Setup
If you want to install and setup `nestia` manually, read [Guide Documents - Setup](https://github.com/samchon/nestia/wiki/Setup).




## `@nestia/core`
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)

super-fast validation decorators for NestJS.

`@nestia/core` is a transformer library of NestJS, supporting super-fast validation decorators, by wrapping [typia](https://github.com/samchon/typia). Comparing validation speed with `class-validator`, `typia` is maximum **15,000x times faster** and it even much safer.

Furthermore, `@nestia/core` can use pure interface typed DTO with **only one line**.

Therefore, it does not require any extra dedication like defining JSON schema (`@nestjs/swagger`) or using class definition with decorator function calls (`class-validator`). Just enjoy the **superfast** decorator with pure TypeScript type.

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

Also, it supports super-fast validation pipe using, which is maximum 15,000x times faster then ordinary `nest.Body()` decorator using `class-validator`.

### TypedRoute
`TypedRoute()` is a decorator function of `application/json` typed reponse body.

Also, it supports safe and fast JSON stringify function pipe, which is maximum 10x times faster than native `JSON.stringify()` function. Furthermore, it is type safe through validation.

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




## `@nestia/sdk`
[![npm version](https://img.shields.io/npm/v/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)
[![Downloads](https://img.shields.io/npm/dm/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)

Automatic *SDK* and *Swagger* generator for [@nestia/core](#nestiacore).

With [@nestia/core](#nestiacore), you can boost up validation speed maximum **15,000x times faster**. However, as `@nestjs/swagger` does not support [@nestia/core](#nestiacore), you can't generate swagger documents from `@nestjs/swagger` more.

Instead, I provide you `@nestia/sdk` module, which can generate not only swagger documents, but also SDK (Software Development Kit) library.

### Usage
```bash
# BASIC COMMAND
npx nestia <sdk|swagger> <source_directories_or_patterns> \
    --exclude <exclude_directory_or_pattern> \
    --out <output_directory_or_file>

# EXAMPLES
npx nestia sdk "src/**/*.controller.ts" --out "src/api"
npx nestia swagger "src/controllers" --out "dist/swagger.json"
```

You can generate sdk or swagger documents by above commands.

If you've configured `nestia.config.ts` file, you can omit all options like below. About the `nestia.config.ts` file, read [Guide Documents - Configuration](https://github.com/samchon/nestia/wiki/Configuration)

```bash
npx nestia sdk
npx nestia swagger
```

### Demonstration
When you generate SDK library through `npx nestia sdk` command, `@nestia/sdk` will generate below code, by analyzing your backend source code in the compilation level. 

```typescript
import { Fetcher, IConnection } from "@nestia/fetcher";
import { IBbsArticle } from "../../../structures/IBbsArticle";

/**
 * Store a new content.
 * 
 * @param input Content to store
 * @returns Newly archived article
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

With SDK library, client developers would get take advantages of TypeScript like below. 

If you want to learn how to distribute SDK library, visit and read [Guide Documents - Distribution](https://github.com/samchon/nestia/wiki/Distribution).

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




## Appendix
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