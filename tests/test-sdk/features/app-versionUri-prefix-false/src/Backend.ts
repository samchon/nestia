import core from "@nestia/core";
import { INestApplication, Module, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import { VersionedController } from "./controllers/VersionedController";

@Module({ controllers: [VersionedController] })
class VersionedModule {}

/** URI versioning whose `prefix: false` puts the bare version in the path. */
export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () => {
      const app: INestApplication = await NestFactory.create(VersionedModule, {
        logger: false,
      });
      app.enableVersioning({
        type: VersioningType.URI,
        prefix: false,
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
