import { WorkerConnector } from "tgrid/protocols/workers/WorkerConnector";

import { TestBuilder } from "./TestBuilder";

async function execute(
    name: string,
    job: "sdk" | "swagger" | "test",
    elements: string[],
): Promise<void> {
    if (job === "test")
        console.log(`${name} -> npx ts-node -C ttypescript src/test`);
    else console.log(`${name} -> npx nestia ${job} ${elements.join(" ")}`);

    const worker = new WorkerConnector(null, null, "process");
    await worker.connect(`${__dirname}/test.builder.executor.js`);

    try {
        const driver = worker.getDriver<typeof TestBuilder>();
        if (job === "test") await driver.test(name);
        else await driver.generate(name, job, elements);
        await worker.close();
    } catch (exp) {
        await worker.close();
        process.exit(-1);
    }
}

function get_arguments(
    target: "directory" | "pattern",
    job: "sdk" | "swagger" | "test",
    specialize: boolean = false,
): string[] {
    return [
        target === "directory" ? "src/controllers" : "src/**/*.controller.ts",
        "--out",
        job === "sdk" ? "src/api" : specialize ? "swagger.json" : "./",
    ];
}

async function main(): Promise<void> {
    console.log("Build Demonstration Projects");
    for (const job of ["swagger", "sdk", "test"] as const) {
        console.log(
            "---------------------------------------------------------",
        );
        await execute("176", job, get_arguments("directory", job));
        await execute("296", job, get_arguments("directory", job));
        await execute("encrypted", job, get_arguments("directory", job));
        await execute("generic", job, get_arguments("directory", job));
        await execute("recursive", job, get_arguments("pattern", job));
        await execute("safe", job, get_arguments("directory", job));
        await execute("union", job, get_arguments("directory", job));
        await execute("multiple-paths", job, get_arguments("directory", job));
    }
}
main().catch((exp) => {
    console.log(exp);
    process.exit(-1);
});
