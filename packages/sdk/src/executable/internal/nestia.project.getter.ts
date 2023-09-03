import { WorkerServer } from "tgrid/protocols/workers/WorkerServer";

import { NestiaProjectGetter } from "./NestiaProjectGetter";

async function main(): Promise<void> {
    const worker = new WorkerServer();
    await worker.open(NestiaProjectGetter);
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
