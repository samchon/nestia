import path from "path";

/**
 * Records scaffold effects and loads caller-built CLI engines.
 *
 * Engines are required by absolute artifact paths because the package exports
 * map blocks deep imports. Process-boundary cases and their fixtures belong to
 * the integrated E2E population.
 *
 * @evidence contracts/common.md#principled-implementation Built engine access uses its absolute artifact path, while fake effects record arguments without invoking programs.
 * @evidence contracts/common.md#clear-and-simple-design Engine loaders, effect records and halt observation are grouped by their role in scaffold units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fakes implement the supported IContext injection seam; they do not modify child_process or filesystem functions.
 * @evidence contracts/common.md#meaningful-documentation The namespace comment describes artifact loading and the separate E2E fixture owner.
 * @evidence contracts/portability.md#os-neutral-implementation Native path.resolve and path.join anchor artifacts on the test workspace cwd; this relies on the canonical runner setting that cwd.
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
  /**
   * Effect boundary implemented by each unit context.
   *
   * @evidence contracts/common.md#principled-implementation The five members retain executable arguments, probe result, directory and path effects from the scaffolder contract.
   * @evidence contracts/common.md#clear-and-simple-design Each member corresponds to one effect that a unit records or answers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This interface mirrors the public injected engine boundary without adding test branches to production.
   * @evidence contracts/common.md#meaningful-documentation Member documentation identifies each effect and its argument meaning.
   * @evidence contracts/portability.md#os-neutral-implementation Executable and path values stay separate strings; the fake interprets neither shell syntax nor filesystem case.
   */
  export interface IContext {
    /**
     * Records a program and its unchanged argument boundaries.
     *
     * @evidence contracts/common.md#principled-implementation The fake records the executable and a copied argument vector so callers can assert command selection without shell parsing.
     * @evidence contracts/common.md#clear-and-simple-design Execution recording is separate from silent availability decisions.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the supported context seam is injected; production selection is not replaced.
     * @evidence contracts/common.md#meaningful-documentation The comment identifies the execute effect and the observable value retained by its unit owner.
     * @evidence contracts/portability.md#os-neutral-implementation Native executable/path inputs remain opaque values at this fake boundary; no shell syntax or filesystem case policy is interpreted.
     */
    execute: (executable: string, args: readonly string[]) => void;

    /**
     * Supplies whether the requested program is available.
     *
     * @evidence contracts/common.md#principled-implementation A recorded executable/vector is passed to the optional predicate, or direct pnpm is available by default.
     * @evidence contracts/common.md#clear-and-simple-design One boolean effect expresses the availability decision.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate uses the supported seam rather than patching command APIs.
     * @evidence contracts/common.md#meaningful-documentation The comment identifies the probe effect and the observable value retained by its unit owner.
     * @evidence contracts/portability.md#os-neutral-implementation Native executable/path inputs remain opaque values at this fake boundary; no shell syntax or filesystem case policy is interpreted.
     */
    probe: (executable: string, args: readonly string[]) => boolean;

    /**
     * Records the directory entered after cloning.
     *
     * @evidence contracts/common.md#principled-implementation The fake appends the requested directory, preserving the engine's destination choice.
     * @evidence contracts/common.md#clear-and-simple-design One effect record separates directory entry from command invocation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It observes the injected boundary without changing process.cwd.
     * @evidence contracts/common.md#meaningful-documentation The comment identifies the chdir effect and the observable value retained by its unit owner.
     * @evidence contracts/portability.md#os-neutral-implementation Native executable/path inputs remain opaque values at this fake boundary; no shell syntax or filesystem case policy is interpreted.
     */
    chdir: (directory: string) => void;

    /**
     * Supplies whether the destination already exists.
     *
     * @evidence contracts/common.md#principled-implementation The optional callback receives the exact path, or the default represents absence.
     * @evidence contracts/common.md#clear-and-simple-design One predicate controls only destination-collision input.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No foreign filesystem methods are replaced.
     * @evidence contracts/common.md#meaningful-documentation The comment identifies the exists effect and the observable value retained by its unit owner.
     * @evidence contracts/portability.md#os-neutral-implementation Native executable/path inputs remain opaque values at this fake boundary; no shell syntax or filesystem case policy is interpreted.
     */
    exists: (path: string) => boolean;

    /**
     * Records a repository-only path removed after scaffolding.
     *
     * @evidence contracts/common.md#principled-implementation The fake records each removal path without deleting files.
     * @evidence contracts/common.md#clear-and-simple-design Removal history remains separate from existence decisions.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The supported context seam substitutes only filesystem effects.
     * @evidence contracts/common.md#meaningful-documentation The comment identifies the remove effect and the observable value retained by its unit owner.
     * @evidence contracts/portability.md#os-neutral-implementation Native executable/path inputs remain opaque values at this fake boundary; no shell syntax or filesystem case policy is interpreted.
     */
    remove: (path: string) => void;
  }
  /**
   * Built scaffold command after its template properties are bound.
   *
   * @evidence contracts/common.md#principled-implementation The curried signature retains halter and optional context before accepting command arguments, matching the engine call contract.
   * @evidence contracts/common.md#clear-and-simple-design One alias supplies the common type of both template loaders.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias describes the real engine boundary and introduces no implementation substitution.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the bound stage represented by this function type.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents unit values or halt observation and owns no native filesystem or process operation.
   */
  export type Cloner = (
    halter: (msg?: string) => never,
    context?: IContext,
  ) => (argv: string[]) => Promise<void>;

  /**
   * Loads the caller-built starter command.
   *
   * @evidence contracts/common.md#principled-implementation The loader requires the built NestiaStarter module and returns its bound clone function.
   * @evidence contracts/common.md#clear-and-simple-design A named accessor identifies the starter artifact without repeating require path construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor returns the real built engine, with injected effects supplied by callers.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies which built command is loaded.
   * @evidence contracts/portability.md#os-neutral-implementation The private loader joins the artifact directory and filename with Node native path operations.
   */
  export const getStarter = (): Cloner =>
    load("NestiaStarter.js").NestiaStarter.clone;
  /**
   * Loads the caller-built template command.
   *
   * @evidence contracts/common.md#principled-implementation The loader requires the built NestiaTemplate module and returns its bound clone function.
   * @evidence contracts/common.md#clear-and-simple-design A named accessor identifies the template artifact without repeating require path construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor returns the real built engine, with injected effects supplied by callers.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies which built command is loaded.
   * @evidence contracts/portability.md#os-neutral-implementation The private loader joins the artifact directory and filename with Node native path operations.
   */
  export const getTemplate = (): Cloner =>
    load("NestiaTemplate.js").NestiaTemplate.clone;

  const load = (file: string): any => require(path.join(CLI_BIN, file));

  /* -----------------------------------------------------------
    UNIT TEST FAKES
  ----------------------------------------------------------- */
  /**
   * Injected context and the effect records owned by one unit invocation.
   *
   * @evidence contracts/common.md#principled-implementation The context is accompanied by typed command, probe, directory and removal records that expose its observable calls.
   * @evidence contracts/common.md#clear-and-simple-design Each effect category has one array, separate from the functions that populate it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Records observe the supported injection seam rather than replacing foreign globals.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies that the record owner is an individual unit invocation.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents unit values or halt observation and owns no native filesystem or process operation.
   */
  export interface IFakeContext {
    context: IContext;
    commands: IInvocation[];
    probes: IInvocation[];
    chdirs: string[];
    removed: string[];
  }
  /**
   * Program name and argument vector recorded by a unit context.
   *
   * @evidence contracts/common.md#principled-implementation Separate executable and argument fields preserve boundaries needed to distinguish clone operands from shell command text.
   * @evidence contracts/common.md#clear-and-simple-design A flat record is shared by execution and availability-probe histories.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape records actual requested inputs without calculating expected test results.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies this as a recorded invocation.
   * @evidence contracts/portability.md#os-neutral-implementation The executable and arguments retain their boundary as values; no shell command string is constructed.
   */
  export interface IInvocation {
    executable: string;
    args: string[];
  }
  /**
   * Creates isolated effect records and customizable existence/availability
   * answers.
   *
   * @evidence contracts/common.md#principled-implementation Each effect closes over fresh arrays and copies incoming argument vectors, so later caller mutations cannot rewrite the recorded invocation.
   * @evidence contracts/common.md#clear-and-simple-design Optional existence and probe functions supply only the two decision inputs; default absence and direct pnpm availability support ordinary units.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The fake uses the documented IContext seam and leaves all production command selection in the engine.
   * @evidence contracts/common.md#meaningful-documentation The comment explains isolation and which answers callers can customize.
   * @evidence contracts/portability.md#os-neutral-implementation The fake records native paths and executable names as opaque inputs without imposing case policy or shell parsing.
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

  /**
   * Distinguishes intentional CLI halts from unexpected engine errors.
   *
   * @evidence contracts/common.md#principled-implementation An Error subclass retains the optional reason while providing a readable fallback message for usage halts.
   * @evidence contracts/common.md#clear-and-simple-design The reason stays on one error type so expectHalt can discriminate it by instanceof.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the injected halter throws this error; unexpected failures are not converted into successful halt assertions.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies intentional halt ownership, while the reason property retains usage versus explicit guidance.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents unit values or halt observation and owns no native filesystem or process operation.
   */
  export class HaltError extends Error {
    public constructor(public readonly reason: string | undefined) {
      super(reason ?? "(usage)");
    }
  }
  /**
   * Throws an observable intentional halt instead of exiting the unit runner.
   *
   * @evidence contracts/common.md#principled-implementation Throwing HaltError satisfies the never-returning boundary while retaining the exact optional reason.
   * @evidence contracts/common.md#clear-and-simple-design One function supplies the same halt semantics to every direct engine unit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The production exit boundary is replaced only through its supported injected parameter, without patching process.exit.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the unit-specific failure observation purpose.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents unit values or halt observation and owns no native filesystem or process operation.
   */
  export const halter = (msg?: string): never => {
    throw new HaltError(msg);
  };
  /**
   * Returns the halt reason and rejects ordinary completion or unrelated
   * errors.
   *
   * @evidence contracts/common.md#principled-implementation The helper awaits the operation, accepts only HaltError and rethrows every unrelated error; completion without a halt is an assertion failure.
   * @evidence contracts/common.md#clear-and-simple-design One try/catch owns the distinction between expected halt, unexpected failure and successful completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unexpected engine errors cannot be swallowed as a passing expected-halt result.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted outcome and both rejected outcomes.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration represents unit values or halt observation and owns no native filesystem or process operation.
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
