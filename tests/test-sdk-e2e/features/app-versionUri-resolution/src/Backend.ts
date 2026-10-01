import core from "@nestia/core";
import { INestApplication, Module, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { OverrideController } from "./controllers/OverrideController";
import { PlainController } from "./controllers/PlainController";

@Module({ controllers: [PlainController, OverrideController] })
class VersionedModule {}

/** URI versioning without a default version. */
export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () => {
      const app: INestApplication = await NestFactory.create(VersionedModule, {
        logger: false,
      });
      app.enableVersioning({
        type: VersioningType.URI,
        prefix: "v",
      });
      await core.WebSocketAdaptor.upgrade(app);
      return app;
    });

  public async open(): Promise<void> {
    return (await this.application.get()).listen(
      Number(process.env.TEST_SDK_PORT ?? 37_000),
    );
  }

  public async close(): Promise<void> {
    return (await this.application.get()).close();
  }
}
