import { Module } from "@nestjs/common";

import { BbsArticlesController } from "./BbsArticlesController";

@Module({
  controllers: [BbsArticlesController],
})
export class BbsArticleModule {}
