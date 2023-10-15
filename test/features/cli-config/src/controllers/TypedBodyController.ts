import { Controller, Request } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("body")
export class TypedBodyController {
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
    @core.TypedRoute.Post()
    public async store(
        @Request() request: any,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        request;
        const output: IBbsArticle = {
            ...typia.random<IBbsArticle>(),
            ...input,
        };
        return output;
    }
}
