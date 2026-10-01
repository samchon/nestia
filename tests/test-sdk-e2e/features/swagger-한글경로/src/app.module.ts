import { Module } from "@nestjs/common";

import { HealthController } from "./controllers/HealthController";
import { PerformanceController } from "./controllers/PerformanceController";

@Module({
  controllers: [HealthController, PerformanceController],
})
export class AppModule {}
