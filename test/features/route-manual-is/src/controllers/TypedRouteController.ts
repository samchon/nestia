import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

@Controller("route")
export class TypedRouteController {
    @core.TypedRoute.Get("random", {
        type: "is",
        is: typia.json.createIsStringify<IBbsArticle>(),
    })
    public async random(): Promise<IBbsArticle> {
        return {
            ...typia.random<IBbsArticle>(),
            ...{
                dummy: 1,
            },
        };
    }
}
