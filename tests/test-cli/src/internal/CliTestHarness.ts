import path from "path";

/**
 * Records scaffold effects and loads caller-built CLI engines.
 *
 * Engines are required by absolute artifact paths because the package exports
 * map blocks deep imports. Process-boundary cases and their fixtures belong to
 * the integrated E2E population.
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
  /** Effect boundary implemented by each unit context. */
  export interface IContext {
    /** Records a program and its unchanged argument boundaries. */
    execute: (executable: string, args: readonly string[]) => void;

    /** Supplies whether the requested program is available. */
    probe: (executable: string, args: readonly string[]) => boolean;

    /** Records the directory entered after cloning. */
    chdir: (directory: string) => void;

    /** Supplies whether the destination already exists. */
    exists: (path: string) => boolean;

    /** Records a repository-only path removed after scaffolding. */
    remove: (path: string) => void;
  }
  /** Built scaffold command after its template properties are bound. */
  export type Cloner = (
    halter: (msg?: string) => never,
    context?: IContext,
  ) => (argv: string[]) => Promise<void>;

  /** Loads the caller-built starter command. */
  export const getStarter = (): Cloner =>
    load("NestiaStarter.js").NestiaStarter.clone;
  /** Loads the caller-built template command. */
  export const getTemplate = (): Cloner =>
    load("NestiaTemplate.js").NestiaTemplate.clone;

  const load = (file: string): any => require(path.join(CLI_BIN, file));

  /* -----------------------------------------------------------
    UNIT TEST FAKES
  ----------------------------------------------------------- */
  /** Injected context and the effect records owned by one unit invocation. */
  export interface IFakeContext {
    context: IContext;
    commands: IInvocation[];
    probes: IInvocation[];
    chdirs: string[];
    removed: string[];
  }
  /** Program name and argument vector recorded by a unit context. */
  export interface IInvocation {
    executable: string;
    args: string[];
  }
  /**
   * Creates isolated effect records and customizable existence/availability
   * answers.
   */
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

  /** Distinguishes intentional CLI halts from unexpected engine errors. */
  export class HaltError extends Error {
    public constructor(public readonly reason: string | undefined) {
      super(reason ?? "(usage)");
    }
  }
  /** Throws an observable intentional halt instead of exiting the unit runner. */
  export const halter = (msg?: string): never => {
    throw new HaltError(msg);
  };
  /**
   * Returns the halt reason and rejects ordinary completion or unrelated
   * errors.
   */
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
