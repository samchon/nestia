import cp from "child_process";
import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";

/**
 * Composes the npm package of the SDK in the distribution directory.
 *
 * @evidence contracts/common.md#principled-implementation The namespace copies the bundle, fills its paths in, and installs the dependencies at the versions the project uses.
 * @evidence contracts/common.md#clear-and-simple-design One public function and the private steps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each filesystem step resolves against the distribution directory; no process-global directory or foreign method is changed.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation Native paths use path.relative/path.join and generated paths use slash separators. npm receives an argument vector and an explicit cwd. POSIX launches npm directly; Windows launches the npm-cli.js shipped beside the first npm.cmd on PATH through Node because a cmd shim itself requires shell interpretation. A nonstandard Windows npm shim lacking that adjacent npm installation is rejected explicitly.
 */
export namespace SdkDistributionComposer {
  /**
   * Prepares the distribution package once: files, paths, and dependencies, and
   * does nothing when the package is already configured.
   *
   * @evidence contracts/common.md#principled-implementation The package counts as configured when it holds `@nestia/fetcher`, which is installed last with its peers, so an interrupted setup runs again. The caller directory is captured once, and every output path and package-manager cwd is explicit.
   * @evidence contracts/common.md#clear-and-simple-design One function of sequential steps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No process-global directory is changed, so independent compositions retain their own destinations.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Existence of the two package files is the filesystem's own answer, and the bundle files are copied over any file of the same name in a distribution directory that is not yet configured, so an interrupted setup repeats the copy.
   */
  export const compose = async (props: {
    config: INestiaConfig;
    mcp: boolean;
    websocket: boolean;
  }) => {
    const root: string = process.cwd();
    const directory: string = path.resolve(props.config.distribute!);
    const output: string = path.resolve(props.config.output!);
    await fs.promises.mkdir(directory, { recursive: true });
    if (await configured(directory)) return;

    console.log("Composing SDK distribution environments...");
    for (const file of await fs.promises.readdir(BUNDLE))
      await fs.promises.copyFile(
        path.join(BUNDLE, file),
        path.join(directory, file),
      );
    for (const file of ["package.json", "tsconfig.json"])
      await replace({ root, output, directory })(file);

    // Compile with ttsc, which applies typia's transform; typia no longer has
    // a setup command. Install each dependency kind together so an interrupted
    // setup cannot mark @nestia/fetcher configured before its runtime peers.
    const v: IDependencies = await dependencies({
      root,
      websocket: props.websocket,
    });
    execute(directory, [
      "install",
      "--save-dev",
      "rimraf",
      `ttsc@${v.ttsc}`,
      `typescript@${v.typescript}`,
    ]);
    execute(directory, [
      "install",
      "--save",
      `@nestia/fetcher@${v.version}`,
      `typia@${v.typia}`,
      ...(props.mcp && v.mcp !== undefined
        ? [`@modelcontextprotocol/sdk@${v.mcp}`]
        : []),
      ...(props.websocket && v.tgrid !== undefined ? [`tgrid@${v.tgrid}`] : []),
    ]);
  };

  const configured = async (directory: string): Promise<boolean> =>
    ["package.json", "tsconfig.json"].every((file) =>
      fs.existsSync(path.join(directory, file)),
    ) &&
    (await (async () => {
      const content = JSON.parse(
        await fs.promises.readFile(
          path.join(directory, "package.json"),
          "utf8",
        ),
      );
      return !!content.dependencies?.["@nestia/fetcher"];
    })());

  const execute = (cwd: string, args: string[]): void => {
    console.log(`  - npm ${args.join(" ")}`);
    if (process.platform !== "win32")
      cp.execFileSync("npm", args, { cwd, stdio: "ignore" });
    else {
      // Windows cannot execute npm.cmd without cmd.exe. Launch the JavaScript
      // entry point installed beside that shim instead, so dependency ranges
      // and paths never pass through a shell's metacharacter interpretation.
      const directories = (process.env.PATH ?? "").split(path.delimiter);
      const directory = directories.find((entry) =>
        fs.existsSync(path.join(entry, "npm.cmd")),
      );
      const cli =
        directory === undefined
          ? undefined
          : [
              path.join(directory, "node_modules/npm/bin/npm-cli.js"),
              path.resolve(directory, "../npm/bin/npm-cli.js"),
            ].find((entry) => fs.existsSync(entry));
      if (cli === undefined)
        throw new Error(
          "Unable to locate npm's JavaScript entry point beside npm.cmd on PATH.",
        );
      cp.execFileSync(process.execPath, [cli, ...args], {
        cwd,
        stdio: "ignore",
      });
    }
  };

  const replace =
    (props: { root: string; output: string; directory: string }) =>
    async (file: string): Promise<void> => {
      const relative = (from: string) => (to: string) =>
        path.relative(from, to).split("\\").join("/");
      const root: string = relative(props.directory)(props.root);
      const output: string = relative(props.directory)(props.output);
      const current: string = relative(props.root)(props.directory);
      const replacements: Record<string, string> = { root, output, current };
      const location: string = path.join(props.directory, file);
      const content: unknown = JSON.parse(
        await fs.promises.readFile(location, "utf8"),
      );
      const substitute = (value: unknown): unknown => {
        if (typeof value === "string")
          return value.replace(
            /\$\{(root|output|current)\}/g,
            (_match, key: string) => replacements[key]!,
          );
        if (Array.isArray(value)) return value.map(substitute);
        if (value !== null && typeof value === "object")
          return Object.fromEntries(
            Object.entries(value).map(([key, element]) => [
              key,
              substitute(element),
            ]),
          );
        return value;
      };
      await fs.promises.writeFile(
        location,
        JSON.stringify(substitute(content), null, 2) + "\n",
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
