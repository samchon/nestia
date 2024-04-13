import { Module, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import { IPointer } from "tstl";

import { IAssertServerProgram } from "../IAssertServerProgram";

export const createNestFastifyAssertProgram =
  (transform: boolean) => (port: number) => async (controller: () => any) => {
    const app: IPointer<NestFastifyApplication | null> = { value: null };

    const provider: IAssertServerProgram<any> = {
      open: async () => {
        app.value = await NestFactory.create<NestFastifyApplication>(
          (() => {
            @Module({
              controllers: [controller()],
            })
            class MyModule {}
            return MyModule;
          })(),
          new FastifyAdapter({ bodyLimit: 50_000_000 }),
          { logger: false },
        );
        if (transform)
          app.value.useGlobalPipes(
            new ValidationPipe({
              transform,
              stopAtFirstError: true,
            }),
          );
        await app.value.listen(port);
        return port;
      },
      close: async () => {
        if (app.value) await app.value.close();
      },
    };

    // OPEN WORKER
    const worker = new tgrid.WorkerServer();
    await worker.open(provider);
  };
