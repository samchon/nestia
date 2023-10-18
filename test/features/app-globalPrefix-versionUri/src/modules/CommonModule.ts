import { Module } from "@nestjs/common";

import { HealthModule } from "./HealthModule";
import { PerformanceModule } from "./PerformanceModule";

@Module({
    imports: [HealthModule, PerformanceModule],
})
export class CommonModule {}
