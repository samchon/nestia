import { Module } from "@nestjs/common";

import { BbsArticlesController } from "../controllers/BbsArticlesController";
import { BbsCommentsController } from "../controllers/BbsCommentsController";

@Module({
    controllers: [BbsArticlesController, BbsCommentsController],
})
export class BbsModule {}
