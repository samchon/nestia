import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    @core.TypedRoute.Get(":id")
    public at(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
    ): IBbsArticle {
        id;
        return {
            ...typia.random<Omit<IBbsArticle, "weak">>(),
            weak: new WeakMap(),
        };
    }
}
