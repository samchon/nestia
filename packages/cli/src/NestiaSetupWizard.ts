import fs from "fs";

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
    const args: ArgumentParser.IArguments = await ArgumentParser.parse(pack);

    // INSTALL NESTIA
    pack.install({ dev: false, modulo: "@nestia/core", version: "latest" });
    pack.install({ dev: false, modulo: "@nestia/e2e", version: "latest" });
    pack.install({ dev: false, modulo: "@nestia/fetcher", version: "latest" });
    pack.install({
      dev: args.runtime === false,
      modulo: "@nestia/sdk",
      version: "latest",
    });
    pack.install({ dev: true, modulo: "@nestia/benchmark", version: "latest" });
    pack.install({ dev: true, modulo: "nestia", version: "latest" });
    pack.install({ dev: false, modulo: "typia", version: "latest" });

    // INSTALL TYPESCRIPT COMPILERS
    pack.install({ dev: true, modulo: "ts-patch", version: "latest" });
    pack.install({ dev: true, modulo: "ts-node", version: "latest" });
    pack.install({
      dev: true,
      modulo: "typescript",
      version: await getTypeScriptVersion(),
    });
    args.project ??= (() => {
      const runner: string = pack.manager === "npm" ? "npx" : pack.manager;
      CommandExecutor.run(`${runner} tsc --init`);
      return (args.project = "tsconfig.json");
    })();

    // SETUP TRANSFORMER
    await pack.save((data) => {
      // COMPOSE PREPARE COMMAND
      data.scripts ??= {};
      if (
        typeof data.scripts.prepare === "string" &&
        data.scripts.prepare.trim().length
      ) {
        if (
          data.scripts.prepare.indexOf("ts-patch install") === -1 &&
          data.scripts.prepare.indexOf("typia patch") === -1
        )
          data.scripts.prepare =
            "ts-patch install && typia patch && " + data.scripts.prepare;
        else if (data.scripts.prepare.indexOf("ts-patch install") === -1)
          data.scripts.prepare = "ts-patch install && " + data.scripts.prepare;
        else if (data.scripts.prepare.indexOf("typia patch") === -1)
          data.scripts.prepare = data.scripts.prepare.replace(
            "ts-patch install",
            "ts-patch install && typia patch",
          );
      } else data.scripts.prepare = "ts-patch install && typia patch";

      // FOR OLDER VERSIONS
      if (typeof data.scripts.postinstall === "string") {
        data.scripts.postinstall = data.scripts.postinstall
          .split("&&")
          .map((str) => str.trim())
          .filter((str) => str.indexOf("ts-patch install") === -1)
          .join(" && ");
        if (data.scripts.postinstall.length === 0)
          delete data.scripts.postinstall;
      }
    });
    CommandExecutor.run(`${pack.manager} run prepare`);

    // CONFIGURE PLUGIN
    await PluginConfigurator.configure(args);
  }

  const getTypeScriptVersion = async (): Promise<string> => {
    const content: string = await fs.promises.readFile(
      `${__dirname}/../package.json`,
      "utf-8",
    );
    const json: { devDependencies: { typescript: string } } =
      JSON.parse(content);
    return json.devDependencies.typescript;
  };
}
