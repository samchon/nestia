import { WorkerServer } from "tgrid/protocols/workers/WorkerServer";
import { NestiaConfig } from "./NestiaConfig";

async function main(): Promise<void> {
    const worker = new WorkerServer();
    await worker.open(NestiaConfig);
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
