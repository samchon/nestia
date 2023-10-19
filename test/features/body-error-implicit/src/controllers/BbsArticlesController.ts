import core from "@nestia/core";
import { Body, Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("bbs/articles")
export class BbsArticlesController {
    @core.TypedRoute.Put(":id")
    public async update(
        @core.TypedParam("id") id: string & tags.Format<"uuid">,
        @core.TypedBody()
        input: {
            title: string & tags.MaxLength<10>;
            content: string & tags.MaxLength<100>;
        },
    ): Promise<void> {
        id;
        input;
    }
}
