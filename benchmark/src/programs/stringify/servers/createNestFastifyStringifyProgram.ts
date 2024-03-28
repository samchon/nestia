import { Module, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import { IPointer } from "tstl";

import { Collection } from "../../../structures/pure/Collection";
import { IStringifyServerProgram } from "../IStringifyServerProgram";

export const createNestFastifyStringifyProgram =
  (transform: boolean) =>
  (port: number) =>
  async <T>(controller: (input: Collection<T>) => any) => {
    const server: IPointer<NestFastifyApplication | null> = { value: null };
    const provider: IStringifyServerProgram<any> = {
      open: async (input) => {
        server.value = await NestFactory.create<NestFastifyApplication>(
          (() => {
            @Module({
              controllers: [controller(input)],
            })
            class MyModule {}
            return MyModule;
          })(),
          new FastifyAdapter(),
          { logger: false },
        );
        if (transform)
          server.value.useGlobalPipes(
            new ValidationPipe({
              transform,
              stopAtFirstError: true,
            }),
          );
        await server.value.listen(port);
        return port;
      },
      close: async () => {
        if (server.value) await server.value.close();
      },
    };

    // OPEN WORKER
    const worker = new tgrid.protocols.workers.WorkerServer();
    await worker.open(provider);
  };
