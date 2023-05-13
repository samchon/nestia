import { INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import tgrid from "tgrid";
import { IPointer } from "tstl/functional/IPointer";

import { IServerProgram } from "../../IServerProgram";

export const createNestExpressStringifyProgram =
    (port: number) =>
    async <T>(controller: (input: T) => any) => {
        const app: IPointer<INestApplication | null> = { value: null };

        const provider: IServerProgram<any> = {
            open: async (input) => {
                app.value = await NestFactory.create(
                    (() => {
                        @Module({
                            controllers: [controller(input)],
                        })
                        class MyModule {}
                        return MyModule;
                    })(),
                    {
                        logger: false,
                    },
                );
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
