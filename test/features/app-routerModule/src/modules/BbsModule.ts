import { Module } from "@nestjs/common";

import { BbsArticleCommentModule } from "./BbsArticleCommentModule";
import { BbsArticleModule } from "./BbsArticleModule";

@Module({
    imports: [BbsArticleModule, BbsArticleCommentModule],
})
export class BbsModule {}
