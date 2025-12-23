import { NestFactory } from "@nestjs/core";
import { McpTestModule } from "./McpTestModule";

async function bootstrap() {
  const app = await NestFactory.create(McpTestModule);
  await app.listen(3000);
  console.log("MCP Test server running on http://localhost:3000");
  console.log("Available endpoints:");
  console.log("  POST /tools/tools - List available MCP tools");
  console.log("  POST /tools/call - Call a specific MCP tool");
}
bootstrap();