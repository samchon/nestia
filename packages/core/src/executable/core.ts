#!/usr/bin/env node
import { ArgumentParser } from "./internal/ArgumentParser";
import { CommandExecutor } from "./internal/CommandExecutor";
import { PackageManager } from "./internal/PackageManager";
import { PluginConfigurator } from "./internal/PluginConfigurator";

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
    console.log("----------------------------------------");
    console.log(" Nestia Setup Wizard");
    console.log("----------------------------------------");

    // LOAD PACKAGE.JSON INFO
    const pack: PackageManager = await PackageManager.mount();

    // TAKE ARGUMENTS
    const args: ArgumentParser.IArguments = await ArgumentParser.parse(pack);

    // INSTALL TYPESCRIPT
    pack.install({ dev: true, modulo: "typescript" });
    args.project ??= (() => {
        CommandExecutor.run("npx tsc --init", false);
        return (args.project = "tsconfig.json");
    })();
    pack.install({ dev: true, modulo: "ts-node" });

    // INSTALL COMPILER
    pack.install({ dev: true, modulo: args.compiler });
    if (args.compiler === "ts-patch") {
        await pack.save((data) => {
            data.scripts ??= {};
            if (typeof data.scripts.prepare === "string")
                data.scripts.prepare =
                    "ts-patch install && " + data.scripts.prepare;
            else data.scripts.prepare = "ts-patch install";
        });
        CommandExecutor.run("npm run prepare", false);
    }

    // INSTALL AND CONFIGURE TYPIA
    pack.install({ dev: false, modulo: "typia" });
    pack.install({ dev: false, modulo: "@nestia/core" });
    await PluginConfigurator.configure(pack, args);
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
