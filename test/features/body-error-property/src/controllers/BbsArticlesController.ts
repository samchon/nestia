import core from "@nestia/core";
import { Body, Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("bbs/articles")
export class BbsArticlesController {
    @core.TypedRoute.Put(":id")
    public async update(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @Body("content") content: string,
    ): Promise<void> {
        id;
        content;
    }
}
