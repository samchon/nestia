import core from "@nestia/core";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

/**
 * An Express application that registers the text body parser itself, which
 * consumes a text/plain request stream before any route decorator reads it.
 */
export class Backend {
  private application_?: NestExpressApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create<NestExpressApplication>(
      await core.EncryptedModule.dynamic(__dirname + "/controllers", {
        key: "A".repeat(32),
        iv: "B".repeat(16),
      }),
      { logger: false },
    );
    this.application_.useBodyParser("text");
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }
}
