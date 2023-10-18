import { Module } from "@nestjs/common";

import { BbsArticlesController } from "../controllers/BbsArticlesController";

@Module({
    controllers: [BbsArticlesController],
})
export class BbsArticleModule {}
