import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import { IPointer } from "tstl";
import typia from "typia";

import { FastifyRoute } from "../../internal/FastifyRoute";
import { IStringifyServerProgram } from "../IStringifyServerProgram";

export const createAjvStringifyProgram =
  (port: number) => async (doc: typia.IJsonApplication<"3.0">) => {
    const server: IPointer<NestFastifyApplication | null> = { value: null };
    const controller = (input: any) => {
      @Controller()
      class AjvStringifyController {
        @FastifyRoute(doc)(Get)("stringify")
        public stringify(): any {
          return input;
        }
      }
      return AjvStringifyController;
    };
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
        await server.value.listen(port);
        return port;
      },
      close: async () => {
        if (server.value) await server.value.close();
      },
    };

    const worker = new tgrid.WorkerServer();
    await worker.open(provider);
  };
