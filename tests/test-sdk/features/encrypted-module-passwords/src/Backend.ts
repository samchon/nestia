import core from "@nestia/core";
import { INestApplication, Module, forwardRef } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Singleton } from "tstl";

import {
  AsyncController,
  CyclicController,
  DynamicController,
  ForwardController,
  InheritedController,
  OwnController,
  PlainController,
} from "./controllers/PasswordControllers";

export const MODULE_PASSWORD = { key: "M".repeat(32), iv: "m".repeat(16) };

@Module({})
class DynamicHost {}

@Module({
  imports: [forwardRef(() => CycleB)],
  controllers: [CyclicController],
})
class CycleA {}

@Module({ imports: [forwardRef(() => CycleA)] })
class CycleB {}

@Module({})
class AsyncHost {}

// ForwardModule is declared below the module that references it, so its
// forward reference cannot resolve while the decorators run
@core.EncryptedModule(
  {
    imports: [
      { module: DynamicHost, controllers: [DynamicController] },
      forwardRef(() => ForwardModule),
      CycleA,
      Promise.resolve({ module: AsyncHost, controllers: [AsyncController] }),
    ],
    controllers: [PlainController, OwnController, InheritedController],
  },
  () => MODULE_PASSWORD,
)
class EncryptedRoot {}

@Module({ controllers: [ForwardController] })
class ForwardModule {}

export class Backend {
  public readonly application: Singleton<Promise<INestApplication>> =
    new Singleton(async () =>
      NestFactory.create(EncryptedRoot, { logger: false }),
    );

  public async open(): Promise<void> {
    return (await this.application.get()).listen(
      Number(process.env.TEST_SDK_PORT ?? 37_000),
    );
  }

  public async close(): Promise<void> {
    return (await this.application.get()).close();
  }
}
