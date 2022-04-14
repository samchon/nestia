import * as cp from "child_process";
import * as process from "process";

const PATH = __dirname;

async function execute(name: string, tail: string): Promise<void>
{
    console.log(name);
    process.chdir(`${PATH}/${name}`);

    const commands: string[] = [
        `npx rimraf src/api/functional`,
        `node ../../bin/executable/nestia sdk ${tail}`,
    ];
    
    let error: Error | null = null;
    try
    {
        for (const comm of commands)
            cp.execSync(comm, { stdio: "inherit" });
    }
    catch (exp)
    {
        error = exp as Error;
    }
    if (error !== null)
        throw error;
}

async function main(): Promise<void>
{
    await execute("absolute", `"src/controllers" --out "src/api"`);
    await execute("alias@api", `"src/controllers" --out "src/api"`);
    await execute("alias@src", `"src/controllers" --out "src/api"`);
    await execute("default", `"src/controllers" --out "src/api"`);
    // await execute("exclude", `"src/controllers" --exclude "src/controllers/**/throw_error.ts" --out "src/api"`);
    await execute("nestia.config.ts", "");
    await execute("reference", `"src/**/*.controller.ts" --out "src/api"`);
    await execute("tsconfig.json", `"src/controllers" --out "src/api"`);
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});