import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("route")
export class TypedRouteController {
    @core.TypedRoute.Get("random")
    public async random(): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            ...{
                dummy: 1,
            },
        };
    }
}
