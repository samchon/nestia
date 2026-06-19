import { Module } from "@nestjs/common";

import { BbsModule } from "./BbsModule";
import { CalculateModule } from "./CalculateModule";
import { CommonModule } from "./CommonModule";

@Module({
  imports: [CommonModule, BbsModule, CalculateModule],
})
export class ApplicationModule {}
