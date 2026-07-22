import cp from "child_process";
import fs from "fs";

export namespace NestiaProjectTemplate {
  /**
   * Side effects performed while scaffolding a template project.
   *
   * Injected so that the scaffolding flow can be unit tested without touching
   * the network, the file system, or a real package manager.
   */
  export interface IContext {
    /** Runs an executable with explicit arguments, inheriting stdio. */
    execute: (executable: string, args: readonly string[]) => void;
    /** Silently checks whether an executable accepts the supplied arguments. */
    probe: (executable: string, args: readonly string[]) => boolean;
    /** Changes the working directory. */
    chdir: (directory: string) => void;
    /** Checks whether a path exists. */
    exists: (path: string) => boolean;
    /** Removes a path recursively, ignoring missing entries. */
    remove: (path: string) => void;
  }

  export interface IProps {
    /** Banner title printed before cloning. */
    title: string;
    /** Default repository URL, overridable through `--repository <url>`. */
    repository: string;
    /** Whether to run the test suite after building. */
    test: boolean;
  }

  export const clone =
    (props: IProps) =>
    (halter: (msg?: string) => never, context: IContext = CONTEXT) =>
    async (argv: string[]): Promise<void> => {
      // VALIDATION
      const { dest, repository } = parse(argv, halter);
      if (dest === undefined) halter();
      else if (context.exists(dest) === true)
        halter("The target directory already exists.");

      console.log("-----------------------------------------");
      console.log(` ${props.title}`);
      console.log("-----------------------------------------");

      // COPY PROJECTS
      context.execute("git", ["clone", repository ?? props.repository, dest]);
      console.log(`cd "${dest}"`);
      context.chdir(dest);

      // TEMPLATE REPOSITORIES ARE PNPM MONOREPOS.
      //
      // Their workspace manifests use the `catalog:` dependency protocol,
      // which npm cannot resolve. Only pnpm (directly installed, or served
      // through corepack) can set them up.
      const pm: ICommand = getPackageManager(halter, context);

      // INSTALL DEPENDENCIES
      context.execute(pm.executable, [...pm.args, "install"]);

      // BUILD TYPESCRIPT
      context.execute(pm.executable, [...pm.args, "run", "build"]);

      // DO TEST
      if (props.test === true)
        context.execute(pm.executable, [...pm.args, "run", "test"]);

      // REMOVE REPOSITORY ONLY FILES
      context.remove(".git");
      context.remove(".github/dependabot.yml");
    };

  interface IArguments {
    dest?: string;
    repository?: string;
  }

  function parse(argv: string[], halter: (msg?: string) => never): IArguments {
    const output: IArguments = {};
    for (let i: number = 0; i < argv.length; ++i) {
      const value: string = argv[i]!;
      if (value === "--repository") {
        const url: string | undefined = argv[i + 1];
        if (url === undefined)
          halter("The --repository option requires a URL value.");
        output.repository = url;
        ++i;
      } else if (value.startsWith("--") === false && output.dest === undefined)
        output.dest = value;
    }
    return output;
  }

  interface ICommand {
    executable: string;
    args: string[];
  }

  function getPackageManager(
    halter: (msg?: string) => never,
    context: IContext,
  ): ICommand {
    if (context.probe("pnpm", ["--version"]) === true)
      return { executable: "pnpm", args: [] };
    else if (context.probe("corepack", ["--version"]) === true) {
      process.env.COREPACK_ENABLE_DOWNLOAD_PROMPT = "0";
      return { executable: "corepack", args: ["pnpm"] };
    }
    return halter(
      [
        "The template project is a pnpm monorepo, but neither pnpm nor",
        "corepack could be found. Install pnpm and try again:",
        "",
        "  npm install --global pnpm",
        "",
        "or activate it through corepack (bundled with Node.js):",
        "",
        "  corepack enable",
      ].join("\n"),
    );
  }

  const CONTEXT: IContext = {
    execute: (executable, args): void => {
      console.log(`\n$ ${[executable, ...args].join(" ")}`);
      cp.execFileSync(executable, args, { stdio: "inherit" });
    },
    probe: (executable, args): boolean => {
      try {
        cp.execFileSync(executable, args, { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    },
    chdir: (directory: string): void => process.chdir(directory),
    exists: (path: string): boolean => fs.existsSync(path),
    remove: (path: string): void =>
      fs.rmSync(path, { recursive: true, force: true }),
  };
}
