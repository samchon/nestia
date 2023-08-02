import { Controller } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "../api/structures/IBbsArticle";

@Controller("method")
export class MethodController {
    @core.TypedRoute.Get("body")
    public body(input: IBbsArticle.IStore): IBbsArticle {
        input;
        return typia.random<IBbsArticle>();
    }
}
