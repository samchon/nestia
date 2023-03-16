import { ArgumentParser } from "./internal/ArgumentParser";
import { CommandExecutor } from "./internal/CommandExecutor";
import { PackageManager } from "./internal/PackageManager";
import { PluginConfigurator } from "./internal/PluginConfigurator";

export namespace NestiaSetupWizard {
    export async function setup(): Promise<void> {
        console.log("----------------------------------------");
        console.log(" Nestia Setup Wizard");
        console.log("----------------------------------------");

        // LOAD PACKAGE.JSON INFO
        const pack: PackageManager = await PackageManager.mount();

        // TAKE ARGUMENTS
        const args: ArgumentParser.IArguments = await ArgumentParser.parse(
            pack,
        );

        // INSTALL TYPESCRIPT
        pack.install({ dev: true, modulo: "typescript", version: "4.9.5" });
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
        pack.install({ dev: true, modulo: "@nestia/sdk" });
        pack.install({ dev: true, modulo: "nestia" });
        await PluginConfigurator.configure(pack, args);
    }
}
