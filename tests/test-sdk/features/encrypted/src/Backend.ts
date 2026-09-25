import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { MyModule } from "./controllers/MyModule";

export class Backend {
  private application_?: NestExpressApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create<NestExpressApplication>(
      MyModule,
      { logger: false },
    );
    // test_api_encrypted_long sends a megabyte of ciphertext, over the
    // 100 kB an unparsed text body may hold
    this.application_.useBodyParser("text", { limit: "10mb" });
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    const app = this.application_;
    await app.close();

    delete this.application_;
  }
}
