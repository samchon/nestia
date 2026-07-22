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
      await fs.promises.mkdir(props.config.distribute!);

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
      const v: IDependencies = await dependencies({
        websocket: props.websocket,
      });
      execute("npm install --save-dev rimraf");
      execute(`npm install --save @nestia/fetcher@${v.version}`);
      execute(`npm install --save typia@${v.typia}`);
      if (props.mcp && v.mcp !== undefined)
        execute(`npm install --save @modelcontextprotocol/sdk@${v.mcp}`);
      if (props.websocket && v.tgrid !== undefined)
        execute(`npm install --save tgrid@${v.tgrid}`);
      execute("npx typia setup --manager npm");
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

  const dependencies = async (opts: {
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
    const required = (key: "version" | "typia"): string => {
      const value: string | undefined =
        key === "version" ? json.version : dependencies[key];
      if (typeof value !== "string" || value.length === 0)
        throw new Error(
          `Unable to resolve ${key} version for SDK distribution.`,
        );
      return value;
    };
    return {
      version: required("version"),
      typia: required("typia"),
      tgrid: opts.websocket ? dependencies.tgrid : undefined,
      mcp: dependencies["@modelcontextprotocol/sdk"],
    };
  };
}

interface IDependencies {
  version: string;
  typia: string;
  tgrid: string | undefined;
  mcp: string | undefined;
}
const BUNDLE = __dirname + "/../../../assets/bundle/distribute";
