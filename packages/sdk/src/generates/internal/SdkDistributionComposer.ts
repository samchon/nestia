import cp from "child_process";
import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";

export namespace SdkDistributionComposer {
  export const compose = async (props: {
    config: INestiaConfig;
    mcp: boolean;
    websocket: boolean;
  }) => {
    if (!fs.existsSync(props.config.distribute!))
      await fs.promises.mkdir(props.config.distribute!, { recursive: true });

    const root: string = process.cwd();
    const output: string = path.resolve(props.config.output!);
    process.chdir(props.config.distribute!);
    try {
      if (await configured()) return;

      // COPY FILES
      console.log("Composing SDK distribution environments...");
      for (const file of await fs.promises.readdir(BUNDLE))
        await fs.promises.copyFile(`${BUNDLE}/${file}`, file);

      // CONFIGURE PATHS
      for (const file of ["package.json", "tsconfig.json"])
        await replace({ root, output })(file);

      // INSTALL PACKAGES
      //
      // The package compiles with ttsc, which applies the typia transform the
      // SDK's `assert` and `simulate` code needs through typia's own plugin;
      // typia removed its `setup` command in 14.0.0.
      const v: IDependencies = await dependencies({
        root,
        websocket: props.websocket,
      });
      execute(
        `npm install --save-dev rimraf ttsc@${v.ttsc} typescript@${v.typescript}`,
      );
      execute(`npm install --save @nestia/fetcher@${v.version}`);
      execute(`npm install --save typia@${v.typia}`);
      if (props.mcp && v.mcp !== undefined)
        execute(`npm install --save @modelcontextprotocol/sdk@${v.mcp}`);
      if (props.websocket && v.tgrid !== undefined)
        execute(`npm install --save tgrid@${v.tgrid}`);
    } finally {
      process.chdir(root);
    }
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

  /**
   * The version of a package the project installed, exactly: the staged package
   * must run the typia, and compile with the ttsc and TypeScript, the project
   * itself uses. A workspace's `catalog:` specifier names no version npm could
   * install, so the specifier is only the fallback.
   */
  const installed = (
    root: string,
    name: string,
    fallback: string | undefined,
  ): string | undefined => {
    try {
      const file: string = require.resolve(`${name}/package.json`, {
        paths: [root, __dirname],
      });
      const version: unknown = JSON.parse(
        fs.readFileSync(file, "utf8"),
      ).version;
      if (typeof version === "string" && version.length !== 0) return version;
    } catch {}
    return fallback !== undefined && fallback.startsWith("catalog:") === false
      ? fallback
      : undefined;
  };

  const dependencies = async (opts: {
    root: string;
    websocket: boolean;
  }): Promise<IDependencies> => {
    const content: string = await fs.promises.readFile(
      __dirname + "/../../../package.json",
      "utf8",
    );
    const json: {
      version: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    } = JSON.parse(content);
    const dependencies: Record<string, string> = {
      ...json.devDependencies,
      ...json.dependencies,
    };
    const required = (key: string, value: string | undefined): string => {
      if (typeof value !== "string" || value.length === 0)
        throw new Error(
          `Unable to resolve ${key} version for SDK distribution.`,
        );
      return value;
    };
    const version = (name: string): string | undefined =>
      installed(opts.root, name, dependencies[name]);
    return {
      version: required("@nestia/fetcher", json.version),
      typia: required("typia", version("typia")),
      ttsc: required("ttsc", version("ttsc")),
      typescript: required("typescript", version("typescript")),
      tgrid: opts.websocket ? version("tgrid") : undefined,
      mcp: version("@modelcontextprotocol/sdk"),
    };
  };
}

interface IDependencies {
  version: string;
  typia: string;
  ttsc: string;
  typescript: string;
  tgrid: string | undefined;
  mcp: string | undefined;
}
const BUNDLE = __dirname + "/../../../assets/bundle/distribute";
