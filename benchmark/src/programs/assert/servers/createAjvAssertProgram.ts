import { Controller, HttpException, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import Ajv from "ajv";
import tgrid from "tgrid";
import typia from "typia";

import { IAssertServerProgram } from "../IAssertServerProgram";

export const createAjvAssertProgram =
    (port: number) => async (doc: typia.IJsonApplication) => {
        // const validate = new Ajv({
        //     strict: true,
        //     strictSchema: false,
        // }).compile({
        //     ...definition.schemas[0],
        //     components: definition.components,
        // });
        const validate = new Ajv({
            strict: true,
            strictSchema: false,
            schemas: (() => {
                const output: Record<string, object> = {};
                for (const [key, value] of Object.entries(
                    doc.components.schemas ?? {},
                )) {
                    const $id: string = `#/components/schemas/${key}`;
                    output[$id] = { ...value, $id };
                }
                return output;
            })(),
        }).compile(doc.schemas[0]);

        @Controller()
        class AssertController {
            @Post("assert")
            public async assert(input: any): Promise<void> {
                const success = validate(input);
                if (success === false)
                    throw new HttpException(
                        validate.errors![0].message ?? "Unknown",
                        400,
                    );
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

        const worker = new tgrid.protocols.workers.WorkerServer();
        await worker.open(provider);
    };
