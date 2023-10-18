import { Module } from "@nestjs/common";

import { BbsModule } from "./BbsModule";
import { CommonModule } from "./CommonModule";

@Module({
    imports: [CommonModule, BbsModule],
})
export class ApplicationModule {}
