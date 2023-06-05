import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { Global } from "../Global";

@Controller("random")
export class RandomController {
    @core.TypedRoute.Get("get")
    public async get(): Promise<IBbsArticle> {
        Global.used = true;
        return typia.random<IBbsArticle>();
    }

    /**
     * @setHeader id
     */
    @core.TypedRoute.Get("header")
    public async header(): Promise<IBbsArticle> {
        Global.used = true;
        return typia.random<IBbsArticle>();
    }
}
