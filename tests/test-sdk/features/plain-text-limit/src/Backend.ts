import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

export const ENCRYPTION = { key: "A".repeat(32), iv: "B".repeat(16) };

export class Backend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await Backend.express();
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }

  public static async express(): Promise<NestExpressApplication> {
    return NestFactory.create<NestExpressApplication>(
      await core.DynamicModule.mount(`${__dirname}/controllers`),
      { logger: false },
    );
  }

  public static async fastify(): Promise<NestFastifyApplication> {
    return NestFactory.create<NestFastifyApplication>(
      await core.DynamicModule.mount(`${__dirname}/controllers`),
      new FastifyAdapter(),
      { logger: false },
    );
  }
}
