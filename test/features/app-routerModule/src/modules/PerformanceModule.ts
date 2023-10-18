import { Module } from "@nestjs/common";

import { PerformanceController } from "../controllers/MixedController";

@Module({
    controllers: [PerformanceController],
})
export class PerformanceModule {}
