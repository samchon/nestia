import { Module } from "@nestjs/common";
import { McpTestController } from "./controllers/McpController";

@Module({
  imports: [],
  controllers: [McpTestController],
})
export class McpTestModule {}