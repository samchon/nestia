import * as cp from "child_process";
import * as process from "process";

const PATH = __dirname;

function execute(name: string, tail: string): void
{
    process.chdir(`${PATH}/${name}`);
    const commands: string[] = [
        `npx rimraf src/api/functional`,
        `npx ts-node -C ttypescript ../../src/bin/nestia sdk ${tail}`,
    ];
    console.log(name);
    for (const comm of commands)
        cp.execSync(comm, { stdio: "inherit" });
}

execute("alias@api", `"src/controllers" --out "src/api"`);
execute("alias@src", `"src/controllers" --out "src/api"`);
execute("default", `"src/controllers" --out "src/api"`);
execute("exclude", `"src/controllers" --out "src/api" --exclude "src/controllers/**/throw_error.ts"`);
execute("nestia.config.ts", "");
execute("reference", `"src/**/*.controller.ts" --out "src/api"`);
execute("tsconfig.json", `"src/controllers" --out "src/api"`);