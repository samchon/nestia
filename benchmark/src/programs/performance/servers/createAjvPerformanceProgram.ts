import { Controller, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import typia from "typia";

import { FastifyBody } from "../../internal/FastifyBody";
import { FastifyRoute } from "../../internal/FastifyRoute";
import { IPerformanceServerProgram } from "../IPerformanceServerProgram";

export const createAjvPerformanceProgram =
    (port: number) => async (doc: typia.IJsonApplication) => {
        @Controller()
        class PerformanceController {
            @FastifyRoute(doc)(Post)("performance")
            public async performance(
                @FastifyBody(doc) input: any,
            ): Promise<any> {
                return input;
            }
        }

        @Module({
            controllers: [PerformanceController],
        })
        class AjvModule {}

        const server = await NestFactory.create<NestFastifyApplication>(
            AjvModule,
            new FastifyAdapter({ bodyLimit: 50_000_000 }),
            { logger: false },
        );
        const provider: IPerformanceServerProgram<any> = {
            open: async () => {
                await server.listen(port);
                return port;
            },
            close: () => server.close(),
        };

        const worker = new tgrid.protocols.workers.WorkerServer();
        await worker.open(provider);
    };
