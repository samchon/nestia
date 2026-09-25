import core from "@nestia/core";
import { INestApplication, Module } from "@nestjs/common";
import { APP_GUARD, NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import {
  EnhancedController,
  GlobalDenyQuery,
  GuardedController,
  ScopedController,
} from "./controllers/EnhancedController";

@Module({
  controllers: [GuardedController, EnhancedController, ScopedController],
  providers: [{ provide: APP_GUARD, useClass: GlobalDenyQuery }],
})
export class EnhancedModule {}

export class Backend {
  private application_?: INestApplication;

  public async open(): Promise<void> {
    this.application_ = await NestFactory.create(EnhancedModule, {
      logger: false,
    });
    await core.WebSocketAdaptor.upgrade(this.application_);
    await this.application_.listen(Number(process.env.TEST_SDK_PORT ?? 37_000));
  }

  public async close(): Promise<void> {
    if (this.application_ === undefined) return;
    await this.application_.close();
    delete this.application_;
  }

  public static async fastify(): Promise<NestFastifyApplication> {
    const app: NestFastifyApplication =
      await NestFactory.create<NestFastifyApplication>(
        EnhancedModule,
        new FastifyAdapter(),
        { logger: false },
      );
    await core.WebSocketAdaptor.upgrade(app);
    return app;
  }
}
