# Nestia Core Library
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Super-fast validation decorators for NestJS.

  - 20,000x faster request body validation
  - 200x faster JSON response, even type safe
  - Do not need DTO class definition, just fine with interface

`@nestia/core` is a transformer library of NestJS, supporting super-fast validation decorators, by wrapping [typia](https://github.com/samchon/typia). Comparing validation speed with `class-validator`, [typia](https://github.com/samchon/typia) is maximum **20,000x faster** and it is even much safer.

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
    @TypedRoute.Post() // 200x faster and safer JSON serialization
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
npm install --save-dev nestia
npx nestia setup
```

Just type above two commands, that's all.

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
    @TypedRoute.Put(":id") // 200x faster and safer JSON serialization
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