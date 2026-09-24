import core from "@nestia/core";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

/**
 * A Fastify application accepting `multipart/form-data` for
 * `@TypedFormData.Body()`, the way the `TypedFormData` guide documents.
 */
export class Backend {
  private application_?: NestFastifyApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create<NestFastifyApplication>(
      await core.DynamicModule.mount(`${__dirname}/controllers`),
      new FastifyAdapter(),
      { logger: false },
    );
    // leave the stream to fastify-multer, which parses it per route
    this.application_
      .getHttpAdapter()
      .getInstance()
      .addContentTypeParser(
        "multipart/form-data",
        (_request: unknown, _payload: unknown, done: (error: null) => void) =>
          done(null),
      );
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
