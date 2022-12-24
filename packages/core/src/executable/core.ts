#!/usr/bin/env node
import { CommandParser } from "./internal/CommandParser";
import { CoreSetupWizard } from "./internal/CoreSetupWizard";

const USAGE = `Wrong command has been detected. Use like below:

  npx @nestia/core setup \\
    --compiler (ttypescript|ts-patch) \\
    --manager (npm|pnpm|yarn) \\
    --project {tsconfig.json file path}

  - npx @nestia/core setup
  - npx @nestia/core setup --compiler ts-patch
  - npx @nestia/core setup --manager pnpm
  - npx @nestia/core setup --project tsconfig.test.json`;

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
    const project: string = options.project ?? "tsconfig.json";
    console.log(options);

    if (
        (compiler !== "ttypescript" && compiler !== "ts-patch") ||
        (manager !== "npm" && manager !== "pnpm" && manager !== "yarn")
    )
        halt(USAGE);
    else if (compiler === "ttypescript")
        await CoreSetupWizard.ttypescript({ manager, project });
    else await CoreSetupWizard.tsPatch({ manager, project });
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
