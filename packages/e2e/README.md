# Nestia E2E Helper
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/e2e.svg)](https://www.npmjs.com/package/@nestia/e2e)
[![Downloads](https://img.shields.io/npm/dm/@nestia/e2e.svg)](https://www.npmjs.com/package/@nestia/e2e)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

Helper library for E2E testing in NestJS.

With `@nestia/e2e`, you can easily validate your NestJS server through E2E testing.

```typescript
import {
    ArrayUtil,
    GaffComparator,
    RandomGenerator,
    TestValidator,
} from "@nestia/e2e";
import typia from "typia";

import api from "@samchon/bbs-api/lib/index";
import { IBbsArticle } from "@samchon/bbs-api/lib/structures/bbs/IBbsArticle";
import { IPage } from "@samchon/bbs-api/lib/structures/common/IPage";

export async function test_api_bbs_article_index_sort(
    connection: api.IConnection,
): Promise<void> {
    // GENERATE 100 ARTICLES
    const section: string = "general";
    const articles: IBbsArticle[] = await ArrayUtil.asyncRepeat(100, () =>
        api.functional.bbs.articles.store(connection, section, {
            writer: RandomGenerator.name(),
            title: RandomGenerator.paragraph(5)(),
            body: RandomGenerator.content(8)()(),
            format: "txt",
            files: [],
            password: RandomGenerator.alphabets(8),
        }),
    );
    typia.assertEquals(articles);

    // PREPARE VALIDATOR
    const validator = TestValidator.sort("BbsArticleProvider.index()")(
        async (
            sort: IPage.IRequest.Sort<IBbsArticle.IRequest.SortableColumns>,
        ) => {
            const page: IPage<IBbsArticle.ISummary> =
                await api.functional.bbs.articles.index(connection, section, {
                    limit: 100,
                    sort,
                });
            return typia.assertEquals(page).data;
        },
    );

    // DO VALIDATE
    const components = [
        validator("created_at")(GaffComparator.dates((x) => x.created_at)),
        validator("updated_at")(GaffComparator.dates((x) => x.updated_at)),
        validator("title")(GaffComparator.strings((x) => x.title)),
        validator("writer")(GaffComparator.strings((x) => x.writer)),
        validator(
            "writer",
            "title",
        )(GaffComparator.strings((x) => [x.writer, x.title])),
    ];
    for (const comp of components) {
        await comp("+", false);
        await comp("-", false);
    }
}
```




## Setup
```bash
npm install --save-dev @nestia/e2e
```

Just setup with npm command, that's all.

For referece, due to test program would not be published, I rcommend to install as `dev` mode.




## Features
About supported features, read descriptive comments of below:

  - [`ArrayUtil`](https://github.com/samchon/nestia/tree/master/packages/e2e/src/ArrayUtil.ts)
  - [`GaffComparator`](https://github.com/samchon/nestia/tree/master/packages/e2e/src/GaffComparator.ts)
  - [`RandomGenerator`](https://github.com/samchon/nestia/tree/master/packages/e2e/src/RandomGenerator.ts)
  - [`StopWatch`](https://github.com/samchon/nestia/tree/master/packages/e2e/src/StopWatch.ts)
  - [`TestValidator`](https://github.com/samchon/nestia/tree/master/packages/e2e/src/TestValidator.ts)