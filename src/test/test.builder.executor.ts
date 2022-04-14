import { WorkerServer } from "tgrid/protocols/workers/WorkerServer";
import { TestBuilder } from "./TestBuilder";

async function main(): Promise<void>
{
    const worker = new WorkerServer();
    await worker.open(TestBuilder);
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});