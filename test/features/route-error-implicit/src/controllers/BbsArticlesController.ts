import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("bbs/articles")
export class BbsArticlesController {
    @core.TypedRoute.Get(":id")
    public async at(@core.TypedParam("id") id: string & tags.Format<"uuid">) {
        return {
            id,
            title: "something",
            body: "content",
            created_at: new Date().toISOString(),
        };
    }
}
