import { NestiaSwaggerComposer } from "@nestia/sdk";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { Singleton } from "tstl";

import { ApplicationModule } from "./modules/ApplicationModule";

export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(() =>
      NestFactory.create(ApplicationModule, { logger: false }),
    );

  public async open(): Promise<void> {
    const app: INestApplication = await this.application.get();
    const document = await NestiaSwaggerComposer.document(app, {});
    SwaggerModule.setup("api", app, document as any);
    await app.listen(37_000);
  }

  public async close(): Promise<void> {
    return (await this.application.get()).close();
  }
}
