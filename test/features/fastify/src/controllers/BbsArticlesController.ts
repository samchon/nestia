import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

@Controller("bbs/articles/:section")
export class BbsArticlesController {
    @core.TypedRoute.Get()
    public async index(
        @core.TypedParam("section") section: string,
        @core.TypedQuery() query: IPage.IRequest,
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
            data: new Array(limit).fill("").map(() => ({
                ...typia.random<IBbsArticle.ISummary>(),
                section,
            })),
        };
    }

    /**
     * Store a new article.
     *
     * @param section Section code
     * @param input Content to store
     * @returns Newly archived article
     */
    @core.TypedRoute.Post()
    public async store(
        @core.TypedParam("section") section: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            section,
            ...input,
        };
    }

    /**
     * Update an article.
     *
     * @param section Section code
     * @param id Target article ID
     * @param input Content to update
     * @returns Updated content
     */
    @core.TypedRoute.Put(":id")
    public async update(
        @core.TypedParam("section") section: string,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            id,
            section,
            ...input,
        };
    }
}
