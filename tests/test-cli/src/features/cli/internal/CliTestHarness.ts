import path from "path";

/**
 * Local helpers for the `nestia start` / `nestia template` unit tests.
 *
 * The tests exercise the built CLI artifacts under `packages/cli/bin`, not the
 * TypeScript sources: they load the scaffolding engine through an absolute-path
 * `require()` because the package's exports map blocks deep subpath imports,
 * and they fake every side effect of the engine. The real executable is run by
 * the shared `tests/test-e2e` entry.
 *
 * @evidence contracts/common.md#principled-implementation The namespace groups actual built-engine access with its supported side-effect context and distinct halt sentinel.
 * @evidence contracts/common.md#clear-and-simple-design Loader, recorder and halt helpers have separate responsibilities under one case-local entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The namespace groups maintained declarations and adds no expected-output behavior or foreign mutation.
 * @evidence contracts/common.md#meaningful-documentation Shared direct CLI engine access and invocation-local effect recording.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups declarations; individual functions own their processing algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace coordinates no completed or in-flight computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained history, handles or running tasks.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The namespace groups declarations; its native loader accessors own filesystem path resolution.
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
   * Supported side-effect boundary of the scaffolding engine.
   *
   * @evidence contracts/common.md#principled-implementation Separate command, probe, directory and removal callbacks represent the engine's actual IContext decisions without changing its implementation.
   * @evidence contracts/common.md#clear-and-simple-design Each callback corresponds to one external effect recorded by the unit context.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This is the supported engine context, rather than replacement methods on Node or the package.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the supported boundary; members describe each effect.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export interface IContext {
    /**
     * Records a command invocation, preserving argument order.
     *
     * @evidence contracts/common.md#principled-implementation Separate executable and readonly argv preserve argument boundaries in the supported engine context.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Records an executable and ordered argv; completion has no return value.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    execute: (executable: string, args: readonly string[]) => void;

    /**
     * Reports whether the requested executable can be used.
     *
     * @evidence contracts/common.md#principled-implementation The boolean reports whether the executable probe succeeded; executable and argv remain distinct inputs while the supplied implementation owns probe effects.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation The callback returns whether a silent executable probe succeeded; its implementation may execute the supplied command to establish availability.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    probe: (executable: string, args: readonly string[]) => boolean;

    /**
     * Changes the engine's target directory.
     *
     * @evidence contracts/common.md#principled-implementation The directory is supplied as one path value; the callback contract keeps directory changes separate from commands.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Requests a target directory change and returns no value.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    chdir: (directory: string) => void;

    /**
     * Reports existence of an engine-owned path.
     *
     * @evidence contracts/common.md#principled-implementation A boolean existence decision lets the engine distinguish absent and existing paths without assuming a platform spelling.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Reports whether the supplied path exists.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    exists: (path: string) => boolean;

    /**
     * Removes the path requested by the engine.
     *
     * @evidence contracts/common.md#principled-implementation The callback identifies one requested removal separately from existence checks and command invocations.
     * @evidence contracts/common.md#clear-and-simple-design This callable declaration states one responsibility through its input and return types; it owns no executable body.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration describes the supported callback boundary and claims no substituted implementation or executed result.
     * @evidence contracts/common.md#meaningful-documentation Requests removal of the supplied path and returns no value.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature declares input and output; the supplied implementation owns native filesystem, process or browser effects.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature chooses no implementation algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no shared computation.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature defines no retention policy or resource acquisition.
     */
    remove: (path: string) => void;
  }
  /**
   * Engine factory whose returned function consumes command-line arguments.
   *
   * @evidence contracts/common.md#principled-implementation The callable shape preserves the real clone factory's halt callback, optional context and asynchronous argv processing.
   * @evidence contracts/common.md#clear-and-simple-design One callable alias expresses the shared starter/template boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias supplies no implementation and does not change the real engine.
   * @evidence contracts/common.md#meaningful-documentation The comment explains the two-stage call and argument ownership.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export type Cloner = (
    halter: (msg?: string) => never,
    context?: IContext,
  ) => (argv: string[]) => Promise<void>;

  /**
   * Loads the built starter engine through its direct declaration.
   *
   * @evidence contracts/common.md#principled-implementation The CLI's exports map hides bin modules, so an absolute require reaches the same built engine used by its executable.
   * @evidence contracts/common.md#clear-and-simple-design The accessor delegates location handling to load and selects the starter export.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor returns the actual engine, with effects supplied through its supported context.
   * @evidence contracts/common.md#meaningful-documentation The comment names the built owner being loaded.
   *
   * @evidence contracts/portability.md#os-neutral-implementation The owning accessor delegates to load, which uses Node path.join and require for the actual built CLI module; it constructs no shell command or platform-specific executable spelling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export const getStarter = (): Cloner =>
    load("NestiaStarter.js").NestiaStarter.clone;
  /**
   * Loads the built template engine through its direct declaration.
   *
   * @evidence contracts/common.md#principled-implementation The selected export is the real template factory, not a reimplementation of its argument policy.
   * @evidence contracts/common.md#clear-and-simple-design The accessor shares load's native location handling and selects one export.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Effects remain at the engine's supported context rather than patched foreign methods.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the template owner.
   *
   * @evidence contracts/portability.md#os-neutral-implementation The owning accessor delegates to load, which uses Node path.join and require for the actual built CLI module; it constructs no shell command or platform-specific executable spelling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export const getTemplate = (): Cloner =>
    load("NestiaTemplate.js").NestiaTemplate.clone;

  /** Resolves a known built CLI module against the workspace's native path. */
  const load = (file: string): any => require(path.join(CLI_BIN, file));

  /* -----------------------------------------------------------
    UNIT TEST FAKES
  ----------------------------------------------------------- */
  /**
   * One invocation's supported context and its ordered effect records.
   *
   * @evidence contracts/common.md#principled-implementation The arrays retain command arguments and directory effects independently of the engine's return value.
   * @evidence contracts/common.md#clear-and-simple-design The context and its observations are returned together so a caller owns one lifetime.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Observations are made through supported callbacks rather than external process or filesystem mutation.
   * @evidence contracts/common.md#meaningful-documentation The comment states invocation ownership and member comments identify the observations.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export interface IFakeContext {
    /** Context passed to one engine execution. */
    context: IContext;

    /** Commands requested, in execution order. */
    commands: IInvocation[];

    /** Executable availability probes, in order. */
    probes: IInvocation[];

    /** Requested directory changes. */
    chdirs: string[];

    /** Requested removals. */
    removed: string[];
  }
  /**
   * Executable identity and a copied argument sequence.
   *
   * @evidence contracts/common.md#principled-implementation Separate executable and argv preserve the process boundary's argument distinctions.
   * @evidence contracts/common.md#clear-and-simple-design Two members express one invocation without shell-string parsing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record describes requested effects and does not fabricate process results.
   * @evidence contracts/common.md#meaningful-documentation Member comments explain identity and copy ownership.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export interface IInvocation {
    /** Executable requested by the engine. */
    executable: string;

    /** Invocation's own argument sequence. */
    args: string[];
  }
  /**
   * Creates an independent recorder for one engine execution.
   *
   * Optional probe and existence decisions are authored inputs. Argument arrays
   * are copied at the callback boundary so later engine mutation cannot change
   * the observations retained by the caller.
   *
   * @evidence contracts/common.md#principled-implementation Supported IContext callbacks capture effects and consult authored probe/existence inputs while copying argv at observation time.
   * @evidence contracts/common.md#clear-and-simple-design Invocation-local arrays expose all effects through one returned record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine's explicit injection boundary is used without replacing Node APIs or process globals.
   * @evidence contracts/common.md#meaningful-documentation The comment explains input controls, copied arguments and independent lifetimes.
   * @evidence contracts/performance.md#efficient-algorithms Recording costs one append per effect and a copy proportional to each invocation's argument count; it does not repeatedly scan prior records.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Separate engine executions need separate effect histories; this operation coordinates no equivalent cross-request computation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each caller owns one returned record whose arrays grow with that execution's effects; no module-level history, handle or background task survives it.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
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
   * Thrown by {@link halter} so tests can observe the halt reason.
   *
   * @evidence contracts/common.md#principled-implementation A distinct Error subclass separates intentional CLI halts from unexpected engine failures and preserves an absent reason.
   * @evidence contracts/common.md#clear-and-simple-design The one reason member retains the halt callback's optional payload.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The class uses the engine's supported halt callback and never replaces process.exit.
   * @evidence contracts/common.md#meaningful-documentation The comment explains why the sentinel exists; reason documents usage versus error halts.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export class HaltError extends Error {
    /** Creates a sentinel; undefined means the engine requested usage output. */
    public constructor(public readonly reason: string | undefined) {
      super(reason ?? "(usage)");
    }
  }
  /**
   * Turns a supported halt callback into an observable failure.
   *
   * @evidence contracts/common.md#principled-implementation Throwing HaltError ends the invocation and retains its optional diagnostic through a distinct sentinel.
   * @evidence contracts/common.md#clear-and-simple-design One throw expresses the callback's never-returning contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The injected halt callback avoids mutating process.exit or other foreign APIs.
   * @evidence contracts/common.md#meaningful-documentation The comment states termination and diagnostic ownership.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
   */
  export const halter = (msg?: string): never => {
    throw new HaltError(msg);
  };
  /**
   * Returns an intentional halt reason, rejecting unexpected failures or
   * success.
   *
   * @evidence contracts/common.md#principled-implementation Only the helper's HaltError sentinel counts as a halt; unexpected exceptions propagate and successful completion is rejected.
   * @evidence contracts/common.md#clear-and-simple-design One await and catch distinguish the three outcomes without retries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper does not swallow foreign failures or convert a completed task into a successful negative case.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies accepted and rejected outcomes.
   *
   * @evidenceExclude contracts/portability.md#os-neutral-implementation This declaration uses in-memory representations and callbacks; the file's module loader owns native path resolution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs bounded setup or describes a callable/value shape; the effect recorder owns variable-sized processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no completed or in-flight computation across consumers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration owns no retained cache, handle or running task; invocation values belong to its caller.
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
