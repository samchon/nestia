# Nestia SDK
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)
[![Downloads](https://img.shields.io/npm/dm/@nestia/sdk.svg)](https://www.npmjs.com/package/@nestia/sdk)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Automatic *SDK* and *Swagger* generator for `@nestia/core`.

With `@nestia/core`, you can boost up validation speed maximum **15,000x times faster**. However, as `@nestjs/swagger` does not support `@nestia/core`, you can't generate swagger documents from `@nestjs/swagger` more.

Instead, I provide you `@nestia/sdk` module, which can generate not only swagger documents, but also SDK (Software Development Kit) library.



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

### Sole Setup
If you want to install and setup `@nestia/sdk` only, just do it.

```bash
npm install --save-dev @nestia/sdk
```




## Usage
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




## Demonstration
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
