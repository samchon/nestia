import core from "@nestia/core";
import { Controller, Headers } from "@nestjs/common";
import typia, { tags } from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IHeaders } from "@api/lib/structures/IHeaders";

@Controller("headers/:section")
export class HeadersController {
    @core.TypedRoute.Patch()
    public emplace(
        @core.TypedHeaders() headers: IHeaders,
        @core.TypedParam("section") section: string,
    ): IHeaders {
        section;
        return headers;
    }

    @core.TypedRoute.Post()
    public store(
        @Headers() headers: IHeaders,
        @core.TypedParam("section") section: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): IBbsArticle {
        section;
        input;
        headers;
        return typia.random<IBbsArticle>();
    }

    @core.TypedRoute.Put(":id")
    public update(
        @core.TypedParam("section") section: string,
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @Headers("x-name") name: string,
        @core.TypedBody() input: IBbsArticle.IStore,
    ): void {
        section;
        id;
        name;
        input;
    }
}
