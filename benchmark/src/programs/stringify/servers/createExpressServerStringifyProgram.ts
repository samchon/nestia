import express from "express";
import { Server } from "http";
import tgrid from "tgrid";
import { IPointer } from "tstl/functional/IPointer";

import { IServerProgram } from "../../IServerProgram";

export const createExpressServerStringifyProgram = async <T>(
    stringify: (input: T) => string | null,
) => {
    // OPEN SERVER
    const modulo = express();
    const server: IPointer<Server | null> = { value: null };

    // PROVIDER
    const provider: IServerProgram<T> = {
        open: async (input) => {
            modulo.get("/stringify", (_, reply) =>
                reply
                    .status(200)
                    .header("Content-Type", "application/json")
                    .send(stringify(input)),
            );
            server.value = await open(modulo);
            return PORT;
        },
        close: () =>
            new Promise((resolve, reject) => {
                if (server.value)
                    server.value.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                else resolve();
            }),
    };

    // OPEN WORKER
    const worker = new tgrid.protocols.workers.WorkerServer();
    await worker.open(provider);
};

const open = (modulo: express.Express) =>
    new Promise<Server>((resolve) => {
        const server = modulo.listen(PORT);
        server.on("listening", () => resolve(server));
    });

const PORT = 37_010;
