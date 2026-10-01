import core from "@nestia/core";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

export class Backend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(
      await core.DynamicModule.mount(`${__dirname}/controllers/express`),
      { logger: false },
    );
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }

  /** The Fastify twin, leaving the multipart stream to fastify-multer. */
  public static async fastify(): Promise<NestFastifyApplication> {
    const app: NestFastifyApplication =
      await NestFactory.create<NestFastifyApplication>(
        await core.DynamicModule.mount(`${__dirname}/controllers/fastify`),
        new FastifyAdapter(),
        { logger: false },
      );
    app
      .getHttpAdapter()
      .getInstance()
      .addContentTypeParser(
        "multipart/form-data",
        (_request: unknown, _payload: unknown, done: (error: null) => void) =>
          done(null),
      );
    return app;
  }
}
