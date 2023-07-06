import cannon from "autocannon";
import PHYSICAL_CPU_COUNT from "physical-cpu-count";
import tgrid from "tgrid";

import { Collection } from "../../structures/pure/Collection";
import { IBenchmarkProgram } from "../IBenchmarkProgram";
import { IStringifyServerProgram } from "./IStringifyServerProgram";

export const createStringifyBenchmarkProgram = async <T>(
    location: string,
): Promise<void> => {
    const provider: IBenchmarkProgram<T> = {
        skip: () => true,
        validate: () => true,
        measure: async (input: T): Promise<IBenchmarkProgram.IMeasurement> => {
            const connector = new tgrid.protocols.workers.WorkerConnector(
                null,
                null,
                "process",
            );
            await connector.connect(location);

            const data: Collection<T> = { data: new Array(100).fill(input) };
            const controller =
                connector.getDriver<IStringifyServerProgram<T>>();
            const port: number = await controller.open(data);

            const result: IBenchmarkProgram.IMeasurement = await shoot(port);
            await controller.close();
            return result;
        },
    };
    const worker = new tgrid.protocols.workers.WorkerServer();
    await worker.open(provider);
};

const shoot = (port: number) =>
    new Promise<IBenchmarkProgram.IMeasurement>((resolve, reject) =>
        cannon(
            {
                url: `http://127.0.0.1:${port}/stringify`,
                method: "GET",
                workers: Math.min(2, PHYSICAL_CPU_COUNT - 2),
                timeout: 300,
                connections: 500,
            },
            (err, result) => {
                if (err) reject(err);
                else
                    resolve({
                        amount: result.throughput.total,
                        time: result.finish.getTime() - result.start.getTime(),
                    });
            },
        ),
    );
