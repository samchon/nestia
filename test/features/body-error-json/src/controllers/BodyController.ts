import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    @core.TypedRoute.Post(":id")
    public update(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @core.TypedBody() input: IBbsArticle.IUpdate,
    ): void {
        id;
        input;
    }
}
