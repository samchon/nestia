import { INestApplication, Module, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import tgrid from "tgrid";
import { IPointer } from "tstl/functional/IPointer";

import { Collection } from "../../../structures/pure/Collection";
import { IStringifyServerProgram } from "../IStringifyServerProgram";

export const createNestExpressStringifyProgram =
    (transform: boolean) =>
    (port: number) =>
    async <T>(controller: (input: Collection<T>) => any) => {
        const server: IPointer<INestApplication | null> = { value: null };
        const provider: IStringifyServerProgram<any> = {
            open: async (input) => {
                server.value = await NestFactory.create(
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
                if (transform)
                    server.value.useGlobalPipes(
                        new ValidationPipe({ transform }),
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
