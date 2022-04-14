import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";

import { TestBuilder } from "./TestBuilder";

async function execute(name: string, elements: string[]): Promise<void>
{
    const worker = new WorkerConnector(null, null, "process");
    const location: string = `${__dirname}/test.builder.executor.js`;

    await worker.connect(location);
    try
    {
        await worker.getDriver<typeof TestBuilder>().main(name, elements);
        await worker.close();
    }
    catch (exp)
    {
        await worker.close();
        process.exit(-1);
    }
}

async function main(): Promise<void>
{
    await execute("absolute", ["src/controllers", "--out", "src/api"]);
    await execute("alias@api", ["src/controllers", "--out", "src/api"]);
    await execute("alias@src", ["src/controllers", "--out", "src/api"]);
    await execute("default", ["src/controllers", "--out", "src/api"]);
    // await execute("exclude", `"src/controllers" --exclude "src/controllers/**/throw_error.ts" --out "src/api"`);
    await execute("nestia.config.ts", []);
    await execute("reference", ["src/**/*.controller.ts", "--out", "src/api"]);
    await execute("tsconfig.json", ["src/controllers", "--out", "src/api"]);
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});