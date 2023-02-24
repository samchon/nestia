# Nestia
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Nestia is a set of helper libraries for NestJS, supporting below features:

  - [`@nestia/core`](#nestiacore): **15,000x times faster** validation decorators
  - [`@nestia/sdk`](#nestiasdk): evolved **SDK** and **Swagger** generators
    - SDK (Software Development Kit)
      - interaction library for client developers
      - almost same with [tRPC](https://github.com/trpc/trpc)
  - `nestia`: just CLI (command line interface) tool

![nestia-sdk-demo](https://user-images.githubusercontent.com/13158709/215004990-368c589d-7101-404e-b81b-fbc936382f05.gif)




## Sponsors and Backers
Thanks for your support.

Your donation would encourage `nestia` development.

[![Backers](https://opencollective.com/nestia/tiers/backers.svg)](https://opencollective.com/nestia)




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

Just type `npx nestia setup`, that's all.

If you've installed [ttypescript](https://github.com/cevek/ttypescript) during setup, you should compile `@nestia/core` utilization code through `ttsc` command, instead of `tsc`. 

```bash
# COMPILE THROUGH TTYPESCRIPT
npx ttsc

# RUN TS-NODE WITH TTYPESCRIPT
npx ts-node -C ttypescript src/index.ts
```

Otherwise, you've chosen [ts-patch](https://github.com/nonara/ts-patch), you can use original `tsc` command. However, [ts-patch](https://github.com/nonara/ts-patch) hacks `node_modules/typescript` source code. Also, whenever update `typescript` version, you've to run `npm run prepare` command repeatedly.

By the way, when using `@nest/cli`, you must just choose [ts-patch](https://github.com/nonara/ts-patch).

```bash
# USE ORIGINAL TSC COMMAND
tsc
npx ts-node src/index.ts

# WHENVER UPDATE
npm install --save-dev typescript@latest
npm run prepare
```

### Manual Setup
If you want to install and configure `nestia` manually, read [Guide Documents -> Setup](https://github.com/samchon/nestia/wiki/Setup).




## `@nestia/core`
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)

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
    @TypedRoute.Post() // 50x faster and safer JSON.stringify()
    public async store(
        @TypedBody() input: IBbsArticle.IStore // super-fast validator
    ): Promise<IBbsArticle>; 
        // do not need DTO class definition, 
        // just fine with interface
}
```

If you want to know more about this core library, visit [Guide Documents](https://github.com/samchon/nestia/wiki).

  - Decorators
    - [TypedRoute](https://github.com/samchon/nestia/wiki/Core-Library#typedroute)
    - [TypedBody](https://github.com/samchon/nestia/wiki/Core-Library#typedbody)
    - [TypedQuery](https://github.com/samchon/nestia/wiki/Core-Library#typedquery)
    - [TypedParam](https://github.com/samchon/nestia/wiki/Core-Library#typedparam)
  - Enhancements
    - [Comment Tags](https://github.com/samchon/nestia/wiki/Core-Library#comment-tags)
    - [Configuration](https://github.com/samchon/nestia/wiki/Core-Library#configuration)
  - Advanced Usage
    - [DynamicModule](https://github.com/samchon/nestia/wiki/Core-Library#dynamicmodule)
    - [Encryption](https://github.com/samchon/nestia/wiki/Core-Library#encryption)
    - [Inheritance](https://github.com/samchon/nestia/wiki/Core-Library#inheritance)




## `@nestia/sdk`
[![npm version](https://img.shields.io/npm/v/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)
[![Downloads](https://img.shields.io/npm/dm/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)

Automatic *SDK* and *Swagger* generator for [@nestia/core](#nestiacore).

With [@nestia/core](#nestiacore), you can boost up validation speed maximum **15,000x times faster**. However, as `@nestjs/swagger` does not support [@nestia/core](#nestiacore), you can't generate swagger documents from `@nestjs/swagger` more.

Instead, I provide you `@nestia/sdk` module, which can generate not only swagger documents, but also SDK (Software Development Kit) library. The SDK library can be utilized by client developers and it is almost same with `tRPC`.

### Usage
```bash
# BASIC COMMAND
npx nestia <sdk|swagger> <source_directories_or_patterns> \
    --exclude <exclude_directory_or_pattern> \
    --out <output_directory_or_file>

# EXAMPLES
npx nestia sdk "src/**/*.controller.ts" --out "src/api"
npx nestia swagger "src/controllers" --out "dist/swagger.json"

# ONLY WHEN "nestia.config.ts" FILE EXISTS
npx nestia sdk
npx nestia swagger
```

You can generate sdk or swagger documents by above commands.

If you want to know more, visit [Guide Documents](https://github.com/samchon/nestia/wiki).

  - Generators
    - [Swagger Documents](https://github.com/samchon/nestia/wiki/SDK-Generator#swagger-documents)
    - [SDK Library](https://github.com/samchon/nestia/wiki/SDK-Generator#sdk-library)
  - Advanced Usage
    - [Comment Tags](https://github.com/samchon/nestia/wiki/SDK-Generator#comment-tags)
    - [Configuration](https://github.com/samchon/nestia/wiki/SDK-Generator#configuration)

### Demonstration
Here is example projects building Swagger Documents and SDK Library with `npx nestia swagger` and `npx nestia sdk` comands. `@nestia/sdk` generates those documents and libraries by analyzing your NestJS backend server code in the compilation level.

Project | Controller | SDK | Swagger
--------|------------|-----|---------
`npx nestia start` | [`BbsArticlesController`](https://github.com/samchon/nestia-template/blob/master/src/controllers/BbsArticlesController.ts) | [Functions](https://github.com/samchon/nestia-template/blob/master/src/api/functional/bbs/articles/index.ts) | [Editor](https://editor.swagger.io/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsamchon%2Fnestia-template%2Fmaster%2Fdist%2Fswagger.json)
[fake-iamport](https://github.com/samchon/fake-iamport-server) | [`IamportCertificationsController`](https://github.com/samchon/fake-iamport-server/blob/master/src/controllers/FakeIamportCertificationsController.ts) | [Functions](https://github.com/samchon/fake-iamport-server/blob/master/src/api/functional/certifications/index.ts) | [Editor](https://editor.swagger.io/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsamchon%2Ffake-iamport-server%2Fmaster%2Fdist%2Fswagger.json)
[fake-toss-payments](https://github.com/samchon/fake-toss-payments-server) | [`TossPaymentsController`](https://github.com/samchon/fake-toss-payments-server/blob/master/src/controllers/FakeTossPaymentsController.ts) | [Functions](https://github.com/samchon/fake-toss-payments-server/blob/master/src/api/functional/v1/payments/index.ts) | [Editor](https://editor.swagger.io/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsamchon%2Ffake-toss-payments-server%2Fmaster%2Fdist%2Fswagger.json)




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

### Reactia
> https://github.com/samchon/reactia
>
> Not published yet, but soon

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/reactia/blob/master/LICENSE)
[![Build Status](https://github.com/samchon/reactia/workflows/build/badge.svg)](https://github.com/samchon/reactia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/reactia/wiki)

Reactia is an automatic React components generator, just by analyzing TypeScript type.

  - `@reactia/core`: Core Library analyzing TypeScript type
  - `@reactia/mui`: Material UI Theme for `core` and `nest`
  - `@reactia/nest`: Automatic Frontend Application Builder for `NestJS`
  <!-- - `reactia`: Just CLI tool -->

![Sample](https://user-images.githubusercontent.com/13158709/199074008-46b2dd67-02be-40b1-aa0f-74ac41f3e0a7.png)

When you want to automate an individual component, just use `@reactia/core`.

```tsx
import ReactDOM from "react-dom";

import typia from "typia";
import { ReactiaComponent } from "@reactia/core";
import { MuiInputTheme } from "@reactia/mui";

const RequestInput = ReactiaComponent<IRequestDto>(MuiInputTheme());
const input: IRequestDto = { ... };

ReactDOM.render(
    <RequestInput input={input} />,
    document.body
);
```

Otherwise, you can fully automate frontend application development through `@reactia/nest`.

```tsx
import React from "react";
import ReactDOM from "react-dom";

import { ISwagger } "@nestia/swagger";
import { MuiApplicationTheme } from "@reactia/mui";
import { ReactiaApplication } from "@reactia/nest";

const swagger: ISwagger = await import("./swagger.json");
const App: React.FC = ReactiaApplication(MuiApplicationTheme())(swagger);

ReactDOM.render(
    <App />,
    document.body
);
```
