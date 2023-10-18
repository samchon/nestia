import { Module } from "@nestjs/common";

import { HealthController } from "../controllers/HealthController";

@Module({
    controllers: [HealthController],
})
export class HealthModule {}
