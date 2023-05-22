import { Module, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import tgrid from "tgrid";
import { IPointer } from "tstl/functional/IPointer";

import { Collection } from "../../../structures/pure/Collection";
import { IStringifyServerProgram } from "../IStringifyServerProgram";

export const createNestFastifyStringifyProgram =
    (transform: boolean) =>
    (port: number) =>
    async <T>(controller: (input: Collection<T>) => any) => {
        const app: IPointer<NestFastifyApplication | null> = { value: null };

        const provider: IStringifyServerProgram<any> = {
            open: async (input) => {
                app.value = await NestFactory.create<NestFastifyApplication>(
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
                    app.value.useGlobalPipes(new ValidationPipe({ transform }));
                await app.value.listen(port);
                return port;
            },
            close: async () => {
                if (app.value) await app.value.close();
            },
        };

        // OPEN WORKER
        const worker = new tgrid.protocols.workers.WorkerServer();
        await worker.open(provider);
    };
