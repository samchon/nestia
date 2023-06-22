import cannon from "autocannon";
import PHYSICAL_CPU_COUNT from "physical-cpu-count";
import tgrid from "tgrid";

import { Collection } from "../../structures/pure/Collection";
import { IBenchmarkProgram } from "../IBenchmarkProgram";
import { IPerformanceServerProgram } from "./IPerformanceServerProgram";

export const createPerformanceBenchmarkProgram = async <T>(
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

            const controller =
                connector.getDriver<IPerformanceServerProgram<T>>();
            const port: number = await controller.open();

            const data: Collection<T> = { data: new Array(100).fill(input) };
            const result: IBenchmarkProgram.IMeasurement = await shoot(port)(
                data,
            );
            await controller.close();
            return result;
        },
    };
    const worker = new tgrid.protocols.workers.WorkerServer();
    await worker.open(provider);
};

const shoot =
    (port: number) =>
    <T>(data: Collection<T>) => {
        const body: string = JSON.stringify(data);
        const size: number = Buffer.from(body).byteLength;
        return new Promise<IBenchmarkProgram.IMeasurement>((resolve, reject) =>
            cannon(
                {
                    url: `http://127.0.0.1:${port}/performance`,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body,
                    workers: Math.min(2, PHYSICAL_CPU_COUNT - 2),
                    timeout: 300,
                    connections: 1_000,
                },
                (err, result) => {
                    if (err) reject(err);
                    else
                        resolve({
                            amount:
                                size *
                                (result["2xx" as "2XX"] * 2 +
                                    result["4xx" as "4XX"]),
                            time:
                                result.finish.getTime() -
                                result.start.getTime(),
                        });
                },
            ),
        );
    };
