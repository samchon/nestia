import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";

import { TestBuilder } from "./TestBuilder";

async function execute
    (
        name: string,
        job: "sdk" | "swagger", 
        elements: string[]
    ): Promise<void>
{
    console.log(`${name} -> npx nestia ${job} ${elements.join(" ")}`);

    const worker = new WorkerConnector(null, null, "process");
    const location: string = `${__dirname}/test.builder.executor.js`;

    await worker.connect(location);
    
    try
    {
        const driver = worker.getDriver<typeof TestBuilder>();
        await driver.main(name, job, elements);
        await worker.close();
    }
    catch (exp)
    {
        await worker.close();
        process.exit(-1);
    }
}

function get_arguments
    (
        target: "directory" | "pattern", 
        job: "sdk" | "swagger",
        specialize: boolean = false
    ): string[]
{
    return [
        target === "directory"
            ? "src/controllers"
            : "src/**/*.controller.ts",
        "--out",
        job === "sdk"
            ? "src/api"
            : specialize 
                ? "swagger.json"
                : "./"
    ];
}

async function main(): Promise<void>
{
    console.log("Build Demonstration Projects");
    for (const job of [/*"sdk", */"swagger"] as const)
    {
        console.log("---------------------------------------------------------");
        await execute("absolute", job, get_arguments("directory", job));
        await execute("alias@api", job, get_arguments("directory", job, true));
        await execute("alias@src", job, get_arguments("directory", job));
        await execute("default", job, get_arguments("directory", job, true));
        await execute("esnext", job, get_arguments("directory", job));
        await execute("nestia.config.ts", job, []);
        await execute("reference", job, get_arguments("pattern", job, true));
        await execute("tsconfig.json", job, get_arguments("directory", job));
    }
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});