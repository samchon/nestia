import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { Global } from "../Global";
import { IPage } from "@api/lib/structures/IPage";

@Controller("random/:section")
export class RandomController {
    /**
     * Paginate entire articles.
     *
     * @param section Section code
     * @param input Page request info
     * @returns Paginated articles with summarized info
     */
    @core.TypedRoute.Patch()
    public async index(
        @core.TypedParam("section") section: string | null,
        @core.TypedBody() input: IPage.IRequest,
    ): Promise<IPage<IBbsArticle.ISummary>> {
        Global.used = true;
        section;
        input;
        return typia.random<IPage<IBbsArticle.ISummary>>();
    }

    /**
     * Paginate entire articles (query ver.).
     *
     * @param section Section code
     * @param input Page request info
     * @returns Paginated articles with summarized info
     */
    @core.TypedRoute.Get()
    public async query(
        @core.TypedParam("section") section: string | null,
        @core.TypedQuery() input: IPage.IRequest,
    ): Promise<IPage<IBbsArticle.ISummary>> {
        Global.used = true;
        section;
        input;
        return typia.random<IPage<IBbsArticle.ISummary>>();
    }

    /**
     * Read an article.
     *
     * @param section Section code
     * @param id Target article ID
     * @returns Detailed article info
     */
    @core.TypedRoute.Get(":id")
    public async at(
        @core.TypedParam("section") section: string,
        @core.TypedParam("id", "uuid") id: string,
    ): Promise<IBbsArticle> {
        Global.used = true;
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
    @core.TypedRoute.Post()
    public async store(
        @core.TypedParam("section") section: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        Global.used = true;
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
        @core.TypedParam("id", "uuid") id: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        Global.used = true;
        return {
            ...typia.random<IBbsArticle>(),
            id,
            section,
            ...input,
        };
    }
}
