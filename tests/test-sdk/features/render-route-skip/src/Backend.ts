import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import path from "path";
import { Singleton } from "tstl";

/** An Express application rendering `.html` views with a stub engine. */
export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () => {
      const app = await NestFactory.create<NestExpressApplication>(
        await core.DynamicModule.mount(`${__dirname}/controllers`),
        { logger: false },
      );
      app.setBaseViewsDir(path.join(__dirname, "..", "views"));
      app.engine(
        "html",
        (
          _file: string,
          _options: object,
          callback: (error: unknown, rendered?: string) => void,
        ) => callback(null, "<p>page</p>"),
      );
      app.setViewEngine("html");
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
