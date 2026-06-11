import { Module } from "@nestjs/common";

import { HealthController } from "../controllers/HealthController";
import { WarmupController } from "../controllers/WarmupController";

@Module({
  controllers: [HealthController, WarmupController],
})
export class HealthModule {}
