import { Controller, HttpException, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import Ajv from "ajv";
import tgrid from "tgrid";
import typia from "typia";

import { FastifyRoute } from "../../internal/FastifyRoute";
import { getFastifyComponents } from "../../internal/getFastifyComponents";
import { IPerformanceServerProgram } from "../IPerformanceServerProgram";

export const createAjvPerformanceProgram =
    (port: number) => async (doc: typia.IJsonApplication) => {
        const validate = new Ajv({
            strict: true,
            strictSchema: false,
            schemas: getFastifyComponents(doc),
        }).compile(doc.schemas[0]);

        @Controller()
        class PerformanceController {
            @FastifyRoute(doc)(Post)("performance")
            public async performance(input: any): Promise<any> {
                const success = validate(input);
                if (success === false)
                    throw new HttpException(
                        validate.errors![0].message ?? "Unknown",
                        400,
                    );
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
