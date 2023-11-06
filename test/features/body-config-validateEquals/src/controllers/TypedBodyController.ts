import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("body")
export class TypedBodyController {
    @core.TypedRoute.Post()
    public async store(
        @core.TypedBody() input: IBbsArticle.IStore,
    ): Promise<IBbsArticle> {
        return {
            ...input,
            id: v4(),
            created_at: new Date().toISOString(),
        };
    }
}
