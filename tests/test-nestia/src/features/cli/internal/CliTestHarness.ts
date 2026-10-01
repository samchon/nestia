import path from "path";

/**
 * Local helpers for the `nestia start` / `nestia template` unit tests.
 *
 * The tests exercise the built CLI artifacts under `packages/cli/bin`, not the
 * TypeScript sources: they load the scaffolding engine through an absolute-path
 * `require()` because the package's exports map blocks deep subpath imports,
 * and they fake every side effect of the engine. The real executable is run by
 * `tests/test-boundaries`.
 */
export namespace CliTestHarness {
  /* -----------------------------------------------------------
    LOCATIONS
  ----------------------------------------------------------- */
  /** Ttsx relocates compiled sources, so anchor on the workspace cwd. */
  export const ROOT: string = path.resolve(process.cwd(), "..", "..");
  export const CLI_BIN: string = path.join(ROOT, "packages", "cli", "bin");

  /* -----------------------------------------------------------
    BUILT ENGINE ACCESSORS
  ----------------------------------------------------------- */
  /** Mirrors `NestiaProjectTemplate.IContext` of `packages/cli`. */
  export interface IContext {
    execute: (executable: string, args: readonly string[]) => void;
    probe: (executable: string, args: readonly string[]) => boolean;
    chdir: (directory: string) => void;
    exists: (path: string) => boolean;
    remove: (path: string) => void;
  }
  export type Cloner = (
    halter: (msg?: string) => never,
    context?: IContext,
  ) => (argv: string[]) => Promise<void>;

  export const getStarter = (): Cloner =>
    load("NestiaStarter.js").NestiaStarter.clone;
  export const getTemplate = (): Cloner =>
    load("NestiaTemplate.js").NestiaTemplate.clone;

  const load = (file: string): any => require(path.join(CLI_BIN, file));

  /* -----------------------------------------------------------
    UNIT TEST FAKES
  ----------------------------------------------------------- */
  export interface IFakeContext {
    context: IContext;
    commands: IInvocation[];
    probes: IInvocation[];
    chdirs: string[];
    removed: string[];
  }
  export interface IInvocation {
    executable: string;
    args: string[];
  }
  export const createFakeContext = (props?: {
    exists?: (path: string) => boolean;
    probe?: (invocation: IInvocation) => boolean;
  }): IFakeContext => {
    const commands: IInvocation[] = [];
    const probes: IInvocation[] = [];
    const chdirs: string[] = [];
    const removed: string[] = [];
    const context: IContext = {
      execute: (executable, args) =>
        void commands.push({ executable, args: [...args] }),
      probe: (executable, args) => {
        const invocation: IInvocation = { executable, args: [...args] };
        probes.push(invocation);
        return props?.probe !== undefined
          ? props.probe(invocation)
          : executable === "pnpm";
      },
      chdir: (directory) => void chdirs.push(directory),
      exists: (location) =>
        props?.exists !== undefined ? props.exists(location) : false,
      remove: (location) => void removed.push(location),
    };
    return { context, commands, probes, chdirs, removed };
  };

  /** Thrown by {@link halter} so tests can observe the halt reason. */
  export class HaltError extends Error {
    public constructor(public readonly reason: string | undefined) {
      super(reason ?? "(usage)");
    }
  }
  export const halter = (msg?: string): never => {
    throw new HaltError(msg);
  };
  export const expectHalt = async (
    task: () => Promise<void>,
  ): Promise<string | undefined> => {
    try {
      await task();
    } catch (error) {
      if (error instanceof HaltError) return error.reason;
      throw error;
    }
    throw new Error("Expected the command to halt, but it completed.");
  };
}
