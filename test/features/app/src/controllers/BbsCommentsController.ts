import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsComment } from "@api/lib/structures/IBbsComment";
import { IPage } from "@api/lib/structures/IPage";

@Controller(":section/articles/:articleId/comments")
export class BbsCommentsController {
    @core.TypedRoute.Get()
    public async index(
        @core.TypedParam("section") section: string,
        @core.TypedParam("articleId") articleId: string & tags.Format<"uuid">,
        @core.TypedQuery() query: IPage.IRequest,
    ): Promise<IPage<IBbsComment>> {
        section;
        articleId;
        query;
        return typia.random<IPage<IBbsComment>>();
    }

    @core.TypedRoute.Get(":id")
    public async at(
        @core.TypedParam("section") section: string,
        @core.TypedParam("articleId") articleId: string & tags.Format<"uuid">,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
    ): Promise<IBbsComment> {
        section;
        articleId;
        id;
        return typia.random<IBbsComment>();
    }

    @core.TypedRoute.Post()
    public async store(
        @core.TypedParam("section") section: string,
        @core.TypedParam("articleId") articleId: string & tags.Format<"uuid">,
        @core.TypedBody() input: IBbsComment.IStore,
    ): Promise<IBbsComment> {
        section;
        articleId;
        input;
        return typia.random<IBbsComment>();
    }

    @core.TypedRoute.Put(":id")
    public async update(
        @core.TypedParam("section") section: string,
        @core.TypedParam("articleId") articleId: string & tags.Format<"uuid">,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @core.TypedBody() input: IBbsComment.IStore,
    ): Promise<IBbsComment> {
        section;
        articleId;
        id;
        input;
        return typia.random<IBbsComment>();
    }
}
