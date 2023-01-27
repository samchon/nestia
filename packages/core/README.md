# Nestia Core Library
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
    @TypedRoute.Put(":id") // 10x faster and safer JSON.stringify()
    public async store(
        @TypedParam("section", "string") section: string,
        @TypedParam("id", "uuid") id: string,
        @TypedBody() input: IBbsArticle.IUpdate // super-fast validator
    ): Promise<IBbsArticle.IContent>;
}
```

About detailed features, read [Guide Documents](https://github.com/samchon/nestia/wiki)

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