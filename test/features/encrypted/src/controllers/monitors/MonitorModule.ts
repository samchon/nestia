import { Module } from "@nestjs/common";

import { HealthController } from "./HealthController";
import { PerformanceController } from "./PerformanceController";

@Module({
  controllers: [HealthController, PerformanceController],
})
export class MonitorModule {}
