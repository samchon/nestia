import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller(["duplicated", "multiple"])
export class DuplicatedController {
    @core.TypedRoute.Get("at")
    public async at(): Promise<IBbsArticle> {
        return article;
    }
}

const article: IBbsArticle = typia.random<IBbsArticle>();
