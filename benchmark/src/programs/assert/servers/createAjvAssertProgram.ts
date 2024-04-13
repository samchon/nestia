import { Controller, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import typia from "typia";

import { FastifyBody } from "../../internal/FastifyBody";
import { IAssertServerProgram } from "../IAssertServerProgram";

export const createAjvAssertProgram =
  (port: number) => async (doc: typia.IJsonApplication<"3.0">) => {
    @Controller()
    class AssertController {
      @Post("assert")
      public async assert(@FastifyBody(doc) input: any): Promise<void> {
        input;
      }
    }

    @Module({
      controllers: [AssertController],
    })
    class AjvModule {}

    const server = await NestFactory.create<NestFastifyApplication>(
      AjvModule,
      new FastifyAdapter({ bodyLimit: 50_000_000 }),
      { logger: false },
    );
    const provider: IAssertServerProgram<any> = {
      open: async () => {
        await server.listen(port);
        return port;
      },
      close: () => server.close(),
    };

    const worker = new tgrid.WorkerServer();
    await worker.open(provider);
  };
