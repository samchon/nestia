import { Module } from "@nestjs/common";
import { McpTestController } from "./controllers/McpController";
import { UtilityController } from "./controllers/UtilityController";

@Module({
  imports: [],
  controllers: [McpTestController, UtilityController],
})
export class McpTestModule {}