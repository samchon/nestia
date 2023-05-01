import { Controller } from "@nestjs/common";
import typia from "typia";

import { TypedQuery, TypedRoute } from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

@Controller("bbs/articles")
export class BbsArticlesController {
    @TypedRoute.Get()
    public async index(
        @TypedQuery() query: IPage.IRequest,
    ): Promise<IPage<IBbsArticle.ISummary>> {
        const limit: number = query.limit ?? 100;
        const current: number = query.page ?? 1;
        const records: number = limit * (current + 3) + 5;

        return {
            pagination: {
                current,
                limit,
                records,
                pages: Math.ceil(records / limit),
            },
            data: new Array(limit)
                .fill("")
                .map(() => typia.random<IBbsArticle.ISummary>()),
        };
    }
}
