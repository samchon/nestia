import { Controller, Headers } from "@nestjs/common";
import typia from "typia";

import core from "@nestia/core";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IHeaders } from "@api/lib/structures/IHeaders";

@Controller("headers/:section")
export class HeadersController {
    @core.TypedRoute.Post()
    public store(
        @Headers() headers: IHeaders,
        @core.TypedParam("section", "string") section: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): IBbsArticle {
        section;
        input;
        headers;
        return typia.random<IBbsArticle>();
    }

    @core.TypedRoute.Put(":id")
    public update(
        @core.TypedParam("section", "string") section: string,
        @core.TypedParam("id", "uuid") id: string,
        @Headers("x-name") name: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): void {
        section;
        id;
        name;
        input;
    }
}
