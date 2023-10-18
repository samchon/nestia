import { Module } from "@nestjs/common";

import { BbsArticleCommentsController } from "../controllers/MixedController";

@Module({
    controllers: [BbsArticleCommentsController],
})
export class BbsArticleCommentModule {}
