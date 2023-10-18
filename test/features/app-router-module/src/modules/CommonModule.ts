import { Module } from "@nestjs/common";

import { HealthController } from "../controllers/HealthController";
import { PerformanceModule } from "./PerformanceModule";

@Module({
    controllers: [HealthController],
    imports: [PerformanceModule],
})
export class CommonModule {}
