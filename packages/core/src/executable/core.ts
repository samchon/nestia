#!/usr/bin/env node
import { CommandParser } from "./internal/CommandParser";
import { CoreSetupWizard } from "./internal/CoreSetupWizard";

const USAGE = `Wrong command has been detected. Use like below:

  npx @nestia/core setup \\
    --compiler (ttypescript|ts-patch) \\
    --manager (npm|pnpm|yarn)

  - npx @nestia/core setup
  - npx @nestia/core setup --compiler ttypescript
  - npx @nestia/core setup --compiler ts-patch
  - npx @nestia/core setup --manager pnpm`;

function halt(desc: string): never {
    console.error(desc);
    process.exit(-1);
}

async function setup(): Promise<void> {
    const options: Record<string, string> = CommandParser.parse(
        process.argv.slice(3),
    );
    const manager: string = options.manager ?? "npm";
    const compiler: string = options.compiler ?? "ttypescript";

    if (
        (compiler !== "ttypescript" && compiler !== "ts-patch") ||
        (manager !== "npm" && manager !== "pnpm" && manager !== "yarn")
    )
        halt(USAGE);
    else if (compiler === "ttypescript")
        await CoreSetupWizard.ttypescript(manager);
    else await CoreSetupWizard.tsPatch(manager);
}

async function main(): Promise<void> {
    const type: string | undefined = process.argv[2];
    if (type === "setup") await setup();
    else halt(USAGE);
}
main().catch((exp) => {
    console.error(exp);
    process.exit(-1);
});
