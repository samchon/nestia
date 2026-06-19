import { Module } from "@nestjs/common";

import { CalculateController } from "../controllers/CalculateController";

@Module({
  controllers: [CalculateController],
})
export class CalculateModule {}
