import cp from "child_process";
import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";
import { PackageManagerDetector } from "../../utils/PackageManagerDetector";
import { SdkManifest } from "../../utils/SdkManifest";

export namespace SdkDistributionComposer {
  export interface IDependencies {
    version: string;
    typia: string;
    tgrid: string | undefined;
    mcp: string | undefined;
  }

  export const compose = async (props: {
    config: INestiaConfig;
    mcp: boolean;
    websocket: boolean;
  }) => {
    if (!fs.existsSync(props.config.distribute!))
      await fs.promises.mkdir(props.config.distribute!);

    const root: string = process.cwd();
    const output: string = path.resolve(props.config.output!);
    const manager: PackageManagerDetector.Manager =
      PackageManagerDetector.detect({
        directory: path.resolve(props.config.distribute!),
      });
    process.chdir(props.config.distribute!);

    const exit = () => process.chdir(root);
    if (await configured()) return exit();

    // COPY FILES
    console.log("Composing SDK distribution environments...");
    const copied: string[] = await copyBundle({
      from: BUNDLE,
      into: process.cwd(),
    });

    // CONFIGURE PATHS (only in files this run created)
    for (const file of ["package.json", "tsconfig.json"])
      if (copied.includes(file)) await replace({ root, output })(file);

    // INSTALL PACKAGES
    //
    // `typia setup` is not invoked anymore: typia v13 dropped that CLI
    // command (only `generate` remains, everything else exits non-zero),
    // and the @next line wires the transform through the ttsc plugin
    // pipeline instead of ts-patch.
    for (const command of commands({
      manager,
      dependencies: dependencies({ websocket: props.websocket }),
      mcp: props.mcp,
      websocket: props.websocket,
    }))
      execute(command);

    exit();
  };

  /**
   * Copies each bundled file into the distribution directory only when the
   * target does not exist yet, and returns the names of the files it created.
   *
   * A user-authored README.md / tsconfig.json / package.json in the
   * distribution directory must never be clobbered by a rerun, following the
   * same write-if-missing contract as the SDK output bundling.
   */
  export const copyBundle = async (props: {
    from: string;
    into: string;
  }): Promise<string[]> => {
    const copied: string[] = [];
    for (const file of await fs.promises.readdir(props.from)) {
      const target: string = path.join(props.into, file);
      if (fs.existsSync(target)) continue;
      await fs.promises.copyFile(path.join(props.from, file), target);
      copied.push(file);
    }
    return copied;
  };

  /**
   * Composes the exact install commands for the detected package manager.
   *
   * Kept pure (inputs -> string[]) so unit tests can assert the command strings
   * without executing any install.
   */
  export const commands = (props: {
    manager: PackageManagerDetector.Manager;
    dependencies: IDependencies;
    mcp: boolean;
    websocket: boolean;
  }): string[] => {
    const add = (dev: boolean, spec: string): string =>
      props.manager === "npm"
        ? `npm install ${dev ? "--save-dev" : "--save"} ${spec}`
        : `${props.manager} add ${dev ? "-D " : ""}${spec}`;
    const output: string[] = [
      add(true, "rimraf"),
      add(false, `@nestia/fetcher@${props.dependencies.version}`),
      add(false, `typia@${props.dependencies.typia}`),
    ];
    if (props.mcp && props.dependencies.mcp !== undefined)
      output.push(
        add(false, `@modelcontextprotocol/sdk@${props.dependencies.mcp}`),
      );
    if (props.websocket && props.dependencies.tgrid !== undefined)
      output.push(add(false, `tgrid@${props.dependencies.tgrid}`));
    return output;
  };

  const configured = async (): Promise<boolean> =>
    ["package.json", "tsconfig.json"].every(fs.existsSync) &&
    (await (async () => {
      const content = JSON.parse(
        await fs.promises.readFile("package.json", "utf8"),
      );
      return !!content.dependencies?.["@nestia/fetcher"];
    })());

  const execute = (command: string) => {
    console.log(`  - ${command}`);
    cp.execSync(command, { stdio: "ignore" });
  };

  const replace =
    (props: { root: string; output: string }) =>
    async (file: string): Promise<void> => {
      const relative = (from: string) => (to: string) =>
        path.relative(from, to).split("\\").join("/");
      const root: string = relative(process.cwd())(props.root);
      const output: string = relative(process.cwd())(props.output);
      const current: string = relative(props.root)(process.cwd());

      const content: string = await fs.promises.readFile(file, "utf8");
      await fs.promises.writeFile(
        file,
        content
          .split("${root}")
          .join(root)
          .split("${output}")
          .join(output)
          .split("${current}")
          .join(current),
        "utf8",
      );
    };

  const dependencies = (opts: { websocket: boolean }): IDependencies => {
    const manifest: SdkManifest.IManifest = SdkManifest.read();
    const required = (key: "version" | "typia"): string => {
      const value: string | undefined =
        key === "version" ? manifest.version : manifest.dependencies[key];
      if (typeof value !== "string" || value.length === 0)
        throw new Error(
          `Unable to resolve ${key} version for SDK distribution.`,
        );
      return value;
    };
    return {
      version: required("version"),
      typia: required("typia"),
      tgrid: opts.websocket ? manifest.dependencies.tgrid : undefined,
      mcp: manifest.dependencies["@modelcontextprotocol/sdk"],
    };
  };
}

const BUNDLE = __dirname + "/../../../assets/bundle/distribute";
