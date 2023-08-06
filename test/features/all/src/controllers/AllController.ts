import { All, Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("all")
export class AllController {
    /**
     * Store an article.
     * 
     * @param request Request object from express. Must be disappeared in SDK
     * @param input Content to store
     * @returns Newly archived article
     * 
     * @author Samchon
     * @warning This is an fake API
     */
    @All()
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
