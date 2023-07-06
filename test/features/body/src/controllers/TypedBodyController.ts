import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("body")
export class TypedBodyController {
    @core.TypedRoute.Post()
    public async store(
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        const output: IBbsArticle = {
            ...typia.random<IBbsArticle>(),
            ...input,
        };
        return output;
    }
}
