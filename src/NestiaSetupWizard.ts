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
        pack.install({ dev: true, modulo: "typescript", version: "latest" });
        args.project ??= (() => {
            CommandExecutor.run("npx tsc --init");
            return (args.project = "tsconfig.json");
        })();
        pack.install({ dev: true, modulo: "ts-node", version: "latest" });

        // INSTALL COMPILER
        await pack.save((data) => {
            data.scripts ??= {};
            if (
                typeof data.scripts.prepare === "string" &&
                data.scripts.prepare.length
            ) {
                if (data.scripts.prepare.indexOf("ts-patch install") === -1)
                    data.scripts.prepare =
                        "ts-patch install && " + data.scripts.prepare;
            } else data.scripts.prepare = "ts-patch install";
        });
        CommandExecutor.run("npm run prepare");

        // INSTALL AND CONFIGURE TYPIA
        pack.install({ dev: false, modulo: "typia", version: "latest" });
        pack.install({ dev: false, modulo: "@nestia/core", version: "latest" });
        pack.install({ dev: true, modulo: "@nestia/sdk", version: "latest" });
        await PluginConfigurator.configure(args);
    }
}
