import multipart from "@fastify/multipart";
import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Singleton } from "tstl";

export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () => {
      const app: NestFastifyApplication = await NestFactory.create(
        await core.EncryptedModule.dynamic(__dirname + "/controllers", {
          key: "A".repeat(32),
          iv: "B".repeat(16),
        }),
        new FastifyAdapter(),
        { logger: false },
      );
      await app.register(multipart);
      return app;
    });

  public async open(): Promise<void> {
    return (await this.application.get()).listen(37_000);
  }

  public async close(): Promise<void> {
    return (await this.application.get()).close();
  }
}
