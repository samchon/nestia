import * as cp from "child_process";
import * as fs from "fs";
import * as process from "process";

const PATH = __dirname;

async function execute(name: string, tail: string): Promise<void>
{
    console.log(name);
    process.chdir(`${PATH}/${name}`);

    const prepare = fs.existsSync("tsconfig.json")
        ? async () =>
        {
            const content = await fs.promises.readFile("tsconfig.json", "utf8");
            return async () => 
            {
                await fs.promises.copyFile("tsconfig.json", "tsconfig.json.bak");
                await fs.promises.writeFile("tsconfig.json", content, "utf8");
            }
        } 
        : () => async () => 
        {
            await fs.promises.copyFile("tsconfig.json", "tsconfig.json.bak");
            await fs.promises.unlink("tsconfig.json");
        }

    const commands: string[] = [
        `npx rimraf src/api/functional`,
        `npx ts-node -C ttypescript ../../src/bin/nestia sdk ${tail}`,
    ];
    
    const restore = await prepare();
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
    await restore();

    if (error !== null)
        throw error;
}

async function main(): Promise<void>
{
    await execute("alias@api", `"src/controllers" --out "src/api"`);
    await execute("alias@src", `"src/controllers" --out "src/api"`);
    await execute("default", `"src/controllers" --out "src/api"`);
    await execute("exclude", `"src/controllers" --out "src/api" --exclude "src/controllers/**/throw_error.ts"`);
    await execute("nestia.config.ts", "");
    await execute("reference", `"src/**/*.controller.ts" --out "src/api"`);
    await execute("tsconfig.json", `"src/controllers" --out "src/api"`);
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});