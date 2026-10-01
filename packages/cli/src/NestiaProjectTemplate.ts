import cp from "child_process";
import fs from "fs";

/**
 * Scaffolds a project from a template repository for `nestia start` and `nestia
 * template`.
 *
 * The flow clones the repository, installs, builds, optionally tests, and then
 * deletes the repository-only files. Every side effect goes through an injected
 * `IContext`, so the flow runs without a network, a file system, or a package
 * manager in unit tests.
 *
 * @evidence contracts/common.md#principled-implementation The scaffold is the fixed sequence clone, install, build, optional test, cleanup, each step one explicit-argument command; the package manager is chosen by probing `pnpm` and then `corepack` because the template repositories are pnpm monorepos whose `catalog:` protocol npm cannot resolve.
 * @evidence contracts/common.md#clear-and-simple-design One namespace owns the flow: `clone` is the sequence, `IContext` the only side-effect boundary, and the private `parse`, `getPackageManager`, and `commandOf` each answer one question; `NestiaStarter` and `NestiaTemplate` only bind a title, URL, and test flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both templates run the identical flow parameterized by props, with no repository-name branches; the only ambient write is the documented corepack variable `COREPACK_ENABLE_DOWNLOAD_PROMPT`, set in the corepack branch to keep the prompt from blocking a scripted run.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose states what the flow does, its ordering, and why side effects are injected; the nested types and `clone` carry their own documentation.
 */
export namespace NestiaProjectTemplate {
  /**
   * Side effects performed while scaffolding a template project.
   *
   * Injected so that the scaffolding flow can be unit tested without touching
   * the network, the file system, or a real package manager.
   *
   * @evidence contracts/common.md#principled-implementation The interface lists exactly the side effects the flow performs (run, probe, change directory, existence check, removal) as function members, so a fake can record every command and a real implementation can delegate to `child_process` and `fs`.
   * @evidence contracts/common.md#clear-and-simple-design Five members, one per distinct effect, with no default behavior in the type; the real implementation is the private `CONTEXT` constant, which keeps the interface a pure seam.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The seam exists because the flow performs process and file-system effects, not to serve a particular test: the production `CONTEXT` implements every member with the real operation.
   * @evidence contracts/common.md#meaningful-documentation The type documentation says the effects are injected for offline testing, and each member states its contract in one sentence.
   */
  export interface IContext {
    /**
     * Runs an executable with explicit arguments, inheriting stdio.
     *
     * @evidence contracts/common.md#principled-implementation An executable and an argument array, never a command string, mirror `execFileSync` semantics, so the flow never depends on shell quoting; inherited stdio lets the user see the clone and install output.
     * @evidence contracts/common.md#clear-and-simple-design One member for commands whose output the user must see and whose failure must stop the flow, separate from the silent `probe`.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The production implementation runs the requested command; no command is skipped or rewritten based on the repository or destination.
     * @evidence contracts/common.md#meaningful-documentation The comment states the argument representation and that stdio is inherited.
     */
    execute: (executable: string, args: readonly string[]) => void;
    /**
     * Silently checks whether an executable accepts the supplied arguments.
     *
     * @evidence contracts/common.md#principled-implementation A probe runs the executable with the given arguments and reports success as a boolean, which is enough to decide whether `pnpm --version` or `corepack --version` is available without interpreting output.
     * @evidence contracts/common.md#clear-and-simple-design Separate from `execute` because a probe is silent and its failure is an answer rather than an error.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Availability is decided by actually invoking the tool; no PATH scan is guessed and no tool name is assumed present.
     * @evidence contracts/common.md#meaningful-documentation The comment states that the check is silent and returns whether the executable accepted the arguments.
     */
    probe: (executable: string, args: readonly string[]) => boolean;
    /**
     * Changes the working directory.
     *
     * @evidence contracts/common.md#principled-implementation The flow must run install and build inside the cloned directory, and changing the working directory of the process is the one operation that redirects every later relative command.
     * @evidence contracts/common.md#clear-and-simple-design A single-purpose member so a fake can record the directory the flow entered.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The production implementation calls `process.chdir` on the requested path, with no fallback directory.
     * @evidence contracts/common.md#meaningful-documentation The comment names the effect, a working-directory change.
     */
    chdir: (directory: string) => void;
    /**
     * Checks whether a path exists.
     *
     * @evidence contracts/common.md#principled-implementation Refusing to scaffold into an existing directory needs one boolean existence check for the destination path.
     * @evidence contracts/common.md#clear-and-simple-design One question with one boolean answer, kept apart from removal.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The production implementation asks the file system directly, with no cached listing.
     * @evidence contracts/common.md#meaningful-documentation The comment states that it checks whether a path exists.
     */
    exists: (path: string) => boolean;
    /**
     * Removes a path recursively, ignoring missing entries.
     *
     * @evidence contracts/common.md#principled-implementation Deleting the repository-only files (`.git`, `.github/dependabot.yml`) after scaffolding is a recursive removal that must succeed when the entry is already absent.
     * @evidence contracts/common.md#clear-and-simple-design One effect, isolated so a fake can record which paths the flow removed.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The production implementation uses `fs.rmSync` with `recursive` and `force`, which is the supported way to make a missing path a no-op, not a swallowed error handler.
     * @evidence contracts/common.md#meaningful-documentation The comment states that removal is recursive and ignores missing entries.
     */
    remove: (path: string) => void;
  }

  /**
   * Per-template constants that parameterize the shared scaffolding flow.
   *
   * @evidence contracts/common.md#principled-implementation The three fields are the only differences between the starter and the template kits: what to announce, where to clone from, and whether to run the tests.
   * @evidence contracts/common.md#clear-and-simple-design A flat record of per-template constants with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Template-specific values live in data passed to one flow, which avoids branching on a template name inside the flow.
   * @evidence contracts/common.md#meaningful-documentation Each field documents its role, including that the repository is overridable through `--repository <url>`.
   */
  export interface IProps {
    /** Banner title printed before cloning. */
    title: string;
    /** Default repository URL, overridable through `--repository <url>`. */
    repository: string;
    /** Whether to run the test suite after building. */
    test: boolean;
  }

  /**
   * Creates the `nestia start` or `nestia template` command for one template.
   *
   * The returned function takes a halter that terminates the process, an
   * optional context, and the command-line arguments after the sub-command. It
   * halts when the destination is missing or already exists, when
   * `--repository` has no value, or when neither pnpm nor corepack is
   * available.
   *
   * @evidence contracts/common.md#principled-implementation Currying separates the per-template props from the halter and context injected at the call site; validation runs before any side effect, so a rejected invocation clones nothing, and the ordered execute calls implement the documented scaffold sequence.
   * @evidence contracts/common.md#clear-and-simple-design One curried function keeps the sequence readable in one place, delegating parsing, package-manager selection, and command shaping to private helpers rather than to options.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The flow contains no fixture or repository names, and the injected context is the production seam: the default `CONTEXT` performs the real clone, install, build, and cleanup.
   * @evidence contracts/common.md#meaningful-documentation The comment states the halting conditions and the injected parameters, and section comments inside the body mark the phases.
   */
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
      const command: ICommand = commandOf(executable, args);
      cp.execFileSync(command.executable, command.args, { stdio: "inherit" });
    },
    probe: (executable, args): boolean => {
      try {
        const command: ICommand = commandOf(executable, args);
        cp.execFileSync(command.executable, command.args, { stdio: "ignore" });
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

  const commandOf = (executable: string, args: readonly string[]): ICommand =>
    process.platform === "win32" &&
    (executable === "pnpm" || executable === "corepack")
      ? {
          executable: "cmd.exe",
          args: ["/d", "/s", "/c", executable, ...args],
        }
      : {
          executable,
          args: [...args],
        };
}
