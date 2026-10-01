import { Module } from "@nestjs/common";

import { SearchController } from "../controllers/SearchController";

@Module({
  controllers: [SearchController],
})
export class SearchModule {}
