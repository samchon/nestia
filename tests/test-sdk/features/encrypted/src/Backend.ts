import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { MyModule } from "./controllers/MyModule";

export class Backend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(MyModule, { logger: false });
    await this.application_.listen(37_000);
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;

    const app = this.application_;
    await app.close();

    delete this.application_;
  }
}
