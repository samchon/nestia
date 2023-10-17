import { Module } from "@nestjs/common";

import { PerformanceController } from "../controllers/PerformanceController";

@Module({
    controllers: [PerformanceController],
})
export class PerformanceModule {}
