import core from "@nestia/core";
import { Controller, VERSION_NEUTRAL, Version } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

@Controller("bbs/:section/articles")
export class BbsArticlesController {
    @Version(["1", "2", VERSION_NEUTRAL])
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

    @Version("1")
    @core.TypedRoute.Get(":id")
    public async at(
        @core.TypedParam("section") section: string,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
    ): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            id,
            section,
        };
    }

    /**
     * Store a new article.
     *
     * @param section Section code
     * @param input Content to store
     * @returns Newly archived article
     */
    @Version(VERSION_NEUTRAL)
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
    @Version("2")
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
