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
      // one install per dependency kind: each npm run resolves and reifies the
      // whole tree again, and the runtime set lands together or not at all, so
      // an interrupted setup never leaves @nestia/fetcher, which marks the
      // package configured, without its peers
      execute(
        `npm install --save-dev rimraf ttsc@${v.ttsc} typescript@${v.typescript}`,
      );
      execute(
        [
          "npm install --save",
          `@nestia/fetcher@${v.version}`,
          `typia@${v.typia}`,
          ...(props.mcp && v.mcp !== undefined
            ? [`@modelcontextprotocol/sdk@${v.mcp}`]
            : []),
          ...(props.websocket && v.tgrid !== undefined
            ? [`tgrid@${v.tgrid}`]
            : []),
        ].join(" "),
      );
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
   * itself uses, with the tgrid and MCP SDK its WebSocket and MCP functions
   * import. `@nestia/sdk`'s own specifier is only the fallback, and a
   * workspace's `catalog:` one names no version npm could install.
   */
  const installed = (
    root: string,
    name: string,
    fallback: string | undefined,
  ): string | undefined =>
    manifestVersion(root, name) ??
    (fallback !== undefined && fallback.startsWith("catalog:") === false
      ? fallback
      : undefined);

  /**
   * The version in the manifest of the package as installed. Not every package
   * exports its `package.json`, as tgrid does not, and a subpath export may map
   * it to a nested manifest of no name, as `@modelcontextprotocol/sdk` maps it
   * to `dist/cjs/package.json`; so the manifest is the nearest `package.json`
   * naming the package, at or above what the request resolves to.
   */
  const manifestVersion = (root: string, name: string): string | undefined => {
    for (const request of [`${name}/package.json`, name]) {
      let file: string;
      try {
        file = require.resolve(request, { paths: [root, __dirname] });
      } catch {
        continue;
      }
      for (let directory: string = path.dirname(file); ; ) {
        try {
          const json: { name?: unknown; version?: unknown } = JSON.parse(
            fs.readFileSync(path.join(directory, "package.json"), "utf8"),
          );
          if (
            json.name === name &&
            typeof json.version === "string" &&
            json.version.length !== 0
          )
            return json.version;
        } catch {}
        const parent: string = path.dirname(directory);
        if (parent === directory) break;
        directory = parent;
      }
    }
    return undefined;
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
