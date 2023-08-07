import { ArgumentParser } from "./internal/ArgumentParser";
import { CommandExecutor } from "./internal/CommandExecutor";
import { PackageManager } from "./internal/PackageManager";
import { PluginConfigurator } from "./internal/PluginConfigurator";

export namespace NestiaSetupWizard {
    export async function setup(): Promise<void> {
        console.log("----------------------------------------");
        console.log(" Nestia Setup Wizard");
        console.log("----------------------------------------");

        // PREPARE ASSETS
        const pack: PackageManager = await PackageManager.mount();
        const args: ArgumentParser.IArguments = await ArgumentParser.parse(
            pack,
        );

        // INSTALL TYPESCRIPT COMPILERS
        pack.install({ dev: true, modulo: "ts-patch", version: "latest" });
        pack.install({ dev: true, modulo: "ts-node", version: "latest" });
        pack.install({ dev: true, modulo: "typescript", version: "latest" });
        args.project ??= (() => {
            const runner: string =
                pack.manager === "npm" ? "npx" : pack.manager;
            CommandExecutor.run(`${runner} tsc --init`);
            return (args.project = "tsconfig.json");
        })();

        // SETUP TRANSFORMER
        await pack.save((data) => {
            // COMPOSE POSTINSTALL COMMAND
            data.scripts ??= {};
            if (
                typeof data.scripts.postinstall === "string" &&
                data.scripts.postinstall.trim().length
            ) {
                if (data.scripts.postinstall.indexOf("ts-patch install") === -1)
                    data.scripts.postinstall =
                        "ts-patch install && " + data.scripts.postinstall;
            } else data.scripts.postinstall = "ts-patch install";

            // FOR OLDER VERSIONS
            if (typeof data.scripts.prepare === "string") {
                data.scripts.prepare = data.scripts.prepare
                    .split("&&")
                    .map((str) => str.trim())
                    .filter((str) => str.indexOf("ts-patch install") === -1)
                    .join(" && ");
                if (data.scripts.prepare.length === 0)
                    delete data.scripts.prepare;
            }
        });
        CommandExecutor.run(`${pack.manager} run postinstall`);

        // INSTALL AND CONFIGURE TYPIA + NESTIA
        pack.install({ dev: false, modulo: "typia", version: "latest" });
        pack.install({ dev: false, modulo: "@nestia/core", version: "latest" });
        pack.install({ dev: true, modulo: "@nestia/e2e", version: "latest" });
        pack.install({ dev: true, modulo: "@nestia/sdk", version: "latest" });
        pack.install({ dev: true, modulo: "nestia", version: "latest" });
        await PluginConfigurator.configure(args);
    }
}
