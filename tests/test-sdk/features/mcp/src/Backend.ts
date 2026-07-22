import core from "@nestia/core";
import { INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { CalculatorController } from "./controllers/CalculatorController";
import { InheritedMcpController } from "./controllers/InheritedMcpController";
import { ImportAliasController } from "./controllers/ImportAliasController";
import { WeatherController } from "./controllers/WeatherController";

@Module({
  controllers: [
    CalculatorController,
    InheritedMcpController,
    ImportAliasController,
    WeatherController,
  ],
})
class McpModule {}

/**
 * NestJS test backend that boots the MCP feature's controllers and mounts the
 * MCP transport at `/mcp` on port 37000.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () => {
      const app: INestApplication = await NestFactory.create(McpModule, {
        logger: false,
      });
      await core.McpAdaptor.upgrade(app, { path: "/mcp" });
      return app;
    });

  public async open(): Promise<void> {
    return (await this.application.get()).listen(37_000);
  }

  public async close(): Promise<void> {
    return (await this.application.get()).close();
  }
}
