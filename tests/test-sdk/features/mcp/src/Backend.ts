import core from "@nestia/core";
import { INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { CalculatorController } from "./controllers/CalculatorController";
import { WeatherController } from "./controllers/WeatherController";

@Module({
  controllers: [CalculatorController, WeatherController],
})
class McpModule {}

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
