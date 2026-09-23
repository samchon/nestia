import { Module } from "@nestjs/common";

import { BbsModule } from "./BbsModule";
import { CommonModule } from "./CommonModule";
import { SearchModule } from "./SearchModule";

@Module({
  imports: [CommonModule, BbsModule, SearchModule],
})
export class ApplicationModule {}
