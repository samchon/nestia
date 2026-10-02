import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";
import { SourceFinder } from "../../utils/SourceFinder";

/**
 * Regenerates the Swagger document when the sources or the configuration
 * change.
 *
 * @evidence contracts/common.md#principled-implementation A session watches the directories of the inputs and the configuration files, ignores the outputs and dependency directories, debounces changes, and queues a change that arrives during a generation.
 * @evidence contracts/common.md#clear-and-simple-design One public function over a session class and private path helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The watchers are installed before each generation so no change between generation and watching is lost, and every watcher is closed on stop.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation One non-recursive `fs.watch` is installed per directory, which every supported platform provides, in place of the `recursive` option that older Linux releases lack. The event's file name can be missing on some platforms and the directory then stands for the change, and a rename without an extension is read as a possible directory change because platforms report directory creation as a rename. Locations are compared by filesystem identity: every ignored path and every event target is resolved to the real path of its nearest existing ancestor, which carries the case and links the volume keeps, so no operating-system name decides a case policy. Remaining assumptions: `fs.watch` event semantics differ per platform, and only SIGINT and SIGTERM are handled, so an abrupt termination ends the watchers with the process.
 * efficient algorithms: Each regeneration walks the watched trees once, one `readdir` and one real-path resolution per directory, and does so twice, before the generation so no edit is lost and after it to see what it wrote, so the cost grows with the number of watched directories and their entries and repeats for every debounced regeneration. A watched directory can appear at any time, so an incremental plan would still have to rescan, and the full rebuild is kept because regeneration is itself far costlier than a scan.
 * reuse equivalent work: Changes inside the debounce window collapse into one regeneration and a change during a running generation sets one pending reason, so equivalent triggers share a run. Each run reloads the configurations because the configuration file is an input, so no result is reused across runs.
 * bound retention and release resources: The session owns one watcher per planned directory, one debounce timer and one pending reason; sync, errors and stop release those handles. Its optional finalizer releases caller-owned generation resources on success, failure and stop. CLI regeneration loads configurations/controllers inside one disposable child whose temporary outputs and module realm end after that generation. Arbitrary programmatic callbacks retain their own module caches and resources; the scheduler cannot release caller-owned caches or objects retained outside their callbacks.
 */
export namespace NestiaSdkWatcher {
  /**
   * The input of the watcher: the configuration file, the configuration loader,
   * the generator, and the project file.
   *
   * @evidence contracts/common.md#principled-implementation The record holds the loaders and the generator the session calls.
   * @evidence contracts/common.md#clear-and-simple-design Native configuration/project paths sit beside the configuration, generation and optional finalization callbacks that own their respective phases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   * @evidence contracts/portability.md#os-neutral-implementation The two file fields are native paths of the project, resolved with `path.resolve` before any comparison.
   * efficient algorithms: The record has no computation.
   * reuse equivalent work: The record coordinates no work.
   * bound retention and release resources: The record owns no handle or task; the session that holds it owns the resources.
   */
  export interface IProps {
    configFile: string;
    /**
     * Loads the current configurations; it is called again at every
     * regeneration so a changed file is read.
     *
     * @evidence contracts/common.md#principled-implementation The loader is a function, not a value, because the configuration file itself is watched.
     * @evidence contracts/common.md#clear-and-simple-design One callback.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is caller code.
     * @evidence contracts/common.md#meaningful-documentation The comment states when it is called.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation A caller callback owns no filesystem or process access here; the loader it wraps owns those decisions.
     * efficient algorithms: The signature performs no computation.
     * reuse equivalent work: The signature coordinates nothing; the session decides when to call it.
     * bound retention and release resources: The signature retains nothing; the session drops the returned configurations after each run.
     */
    configurations: () => Promise<INestiaConfig[]>;
    /**
     * Runs the generation for the loaded configurations.
     *
     * @evidence contracts/common.md#principled-implementation The watcher only schedules the call and reports its errors.
     * @evidence contracts/common.md#clear-and-simple-design One callback.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is caller code.
     * @evidence contracts/common.md#meaningful-documentation The comment states what it does.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation A caller callback owns no filesystem or process access here; the generator it wraps owns those decisions.
     * efficient algorithms: The signature performs no computation.
     * reuse equivalent work: The signature coordinates nothing; the session serializes its calls.
     * bound retention and release resources: The signature retains nothing.
     */
    generate: (configurations: INestiaConfig[]) => Promise<void>;

    /**
     * Releases caller-owned per-generation resources after success or failure,
     * and when the session is stopped. It may overlap an in-flight generation
     * during stop, so its implementation must make release idempotent.
     *
     * @evidence contracts/common.md#principled-implementation The hook lets the caller release generation-owned resources on completion, failure and stop, including overlap with an active generation.
     * @evidence contracts/common.md#clear-and-simple-design One optional finalizer avoids making the scheduler depend on a particular generator resource representation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Resource release is delegated to its actual owner rather than changing foreign caches or callbacks.
     * @evidence contracts/common.md#meaningful-documentation The comment states call timing and the idempotency required when stop overlaps work.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature exposes no native path or process representation; the caller’s finalizer owns that boundary.
     * efficient algorithms: The signature performs no release computation; its caller supplies the implementation.
     * reuse equivalent work: The signature shares no results; the session determines finalization timing.
     * bound retention and release resources: The signature owns no retained state or handle; the session joins the caller’s release operation and the caller owns external resources.
     */
    finalize?: () => Promise<void>;
    projectFile: string;
  }

  /**
   * Starts the watch session, generates once, and never resolves until the
   * process ends.
   *
   * The session closes its watchers and exits on SIGINT and SIGTERM.
   *
   * @evidence contracts/common.md#principled-implementation The first generation runs before the promise that never settles, and a failed generation is printed with its causes and does not stop the session.
   * @evidence contracts/common.md#clear-and-simple-design One function that creates the session and blocks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The watchers are released by the signal handlers.
   * @evidence contracts/common.md#meaningful-documentation The comment states the blocking and the signals.
   * @evidence contracts/portability.md#os-neutral-implementation The signal handlers are registered with `process.once` for SIGINT and SIGTERM and exit with status 0 after closing the watchers; SIGINT is delivered on every platform while Windows never delivers SIGTERM, so a termination request there ends the process without the handler.
   * efficient algorithms: The function creates one session and awaits one generation; its cost is that of the first regeneration described by the namespace.
   * reuse equivalent work: The first generation is the only work the function itself requests, and later regenerations are coordinated by the session, which collapses equivalent triggers.
   * bound retention and release resources: The returned promise never settles by design, so the session lives until the process ends; the handlers release its watchers and timer on SIGINT and SIGTERM, and the process exit releases them otherwise.
   */
  export const watch = async (props: IProps): Promise<void> => {
    const session = new WatchSession(props);
    session.registerSignals();
    await session.regenerate("initial generation");
    await new Promise<void>(() => {});
  };
}

class WatchSession {
  private readonly watchers: Map<string, fs.FSWatcher> = new Map();
  private debounce: NodeJS.Timeout | null = null;
  private ignored: string[] = [];
  private pending: string | null = null;
  private running: boolean = false;
  private stopped: boolean = false;

  public constructor(private readonly props: NestiaSdkWatcher.IProps) {}

  public registerSignals(): void {
    const stop = (): void => {
      this.dispose();
      void (async () => {
        try {
          await this.props.finalize?.();
          process.exit(0);
        } catch (error) {
          printError(error);
          process.exit(1);
        }
      })();
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  }

  public async regenerate(reason: string): Promise<void> {
    if (this.stopped) return;
    if (this.running) {
      this.pending = reason;
      return;
    }

    this.running = true;
    try {
      let nextReason: string | null = reason;
      do {
        const current: string = nextReason;
        nextReason = null;
        this.pending = null;
        let configurations: INestiaConfig[] = [];
        let generationError: unknown;
        try {
          if (current === "initial generation")
            console.log("Starting nestia swagger watch mode");
          else
            console.log(`Change detected (${current}); regenerating swagger`);

          configurations = await this.props.configurations();
          // Watchers must be live before artifacts are written: consumers react
          // to the artifact appearing, and an edit arriving between the write
          // and a later watcher installation would be lost forever. Changes
          // during generation queue through `pending`.
          await this.refresh(configurations);
          await this.props.generate(configurations);
          await this.refresh(configurations);
          console.log(
            `Watching ${this.watchers.size} directories. Press Ctrl+C to stop.`,
          );
        } catch (error) {
          generationError = error;
          if (!this.stopped) {
            console.error("Nestia swagger watch generation failed:");
            printError(error);
            try {
              await this.refresh(configurations);
            } catch (refreshError) {
              console.error("Nestia swagger watch refresh failed:");
              printError(refreshError);
            }
          }
        } finally {
          try {
            await this.props.finalize?.();
          } catch (error) {
            if (!this.stopped && error !== generationError) {
              console.error("Nestia swagger watch cleanup failed:");
              printError(error);
            }
          }
        }
        nextReason = this.pending;
      } while (nextReason !== null && !this.stopped);
    } finally {
      this.running = false;
    }
  }

  private schedule(reason: string): void {
    if (this.stopped) return;
    if (this.debounce !== null) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.debounce = null;
      void this.regenerate(reason);
    }, 250);
  }

  private async refresh(configurations: INestiaConfig[]): Promise<void> {
    if (this.stopped) return;
    const next = await collectWatchPlan({
      configurations,
      configFile: this.props.configFile,
      projectFile: this.props.projectFile,
    });
    this.ignored = next.ignored;

    const directories: Set<string> = new Set();
    for (const target of next.targets)
      await collectDirectories({
        directories,
        ignored: next.ignored,
        target,
      });
    this.sync(directories);
  }

  private sync(next: Set<string>): void {
    if (this.stopped) return;
    for (const [directory, watcher] of this.watchers)
      if (next.has(directory) === false) {
        watcher.close();
        this.watchers.delete(directory);
      }

    for (const directory of next) {
      if (this.watchers.has(directory)) continue;
      try {
        const watcher = fs.watch(directory, (event, filename) => {
          const target =
            filename === null || filename === undefined
              ? directory
              : path.resolve(directory, String(filename));
          if (shouldIgnore(target, this.ignored)) return;
          if (shouldReact({ event, target }) === false) return;
          this.schedule(relative(target));
        });
        watcher.on("error", () => {
          watcher.close();
          this.watchers.delete(directory);
          this.schedule(relative(directory));
        });
        this.watchers.set(directory, watcher);
      } catch {
        continue;
      }
    }
  }

  private dispose(): void {
    this.stopped = true;
    if (this.debounce !== null) clearTimeout(this.debounce);
    for (const watcher of this.watchers.values()) watcher.close();
    this.watchers.clear();
  }
}

interface IWatchPlan {
  ignored: string[];
  targets: string[];
}

const collectWatchPlan = async (props: {
  configurations: INestiaConfig[];
  configFile: string;
  projectFile: string;
}): Promise<IWatchPlan> => {
  const targets: Set<string> = new Set([
    path.resolve(props.configFile),
    path.resolve(props.projectFile),
  ]);
  const ignored: Set<string> = new Set([
    path.resolve("node_modules"),
    path.resolve(".git"),
  ]);

  for (const config of props.configurations) {
    for (const target of await inputTargets(config.input)) targets.add(target);
    for (const target of outputTargets(config)) ignored.add(target);
  }
  return {
    ignored: [...ignored].map(canonical),
    targets: [...targets],
  };
};

const inputTargets = async (
  input: INestiaConfig["input"],
): Promise<string[]> => {
  if (typeof input === "function") {
    const fallback: string = path.resolve("src");
    return [fs.existsSync(fallback) ? fallback : process.cwd()];
  }

  const patterns: string[] = Array.isArray(input)
    ? input
    : typeof input === "object"
      ? input.include
      : [input];
  const output: Set<string> = new Set();
  for (const pattern of patterns) {
    for (const target of await patternTargets(pattern)) output.add(target);
  }
  return [...output];
};

const patternTargets = async (pattern: string): Promise<string[]> => {
  const output: Set<string> = new Set();
  const direct: string = path.resolve(pattern);
  if (fs.existsSync(direct)) output.add(direct);

  if (hasGlobMagic(pattern)) {
    const root: string = staticRoot(pattern);
    if (fs.existsSync(root)) output.add(root);
    for (const match of await SourceFinder.expand(pattern)) output.add(match);
  }
  return [...output];
};

const outputTargets = (config: INestiaConfig): string[] => {
  const output: string[] = [];
  for (const value of [config.output, config.e2e, config.distribute])
    if (typeof value === "string") output.push(path.resolve(value));
  if (config.swagger?.output !== undefined) {
    const parsed: path.ParsedPath = path.parse(config.swagger.output);
    output.push(
      parsed.ext
        ? path.resolve(config.swagger.output)
        : path.resolve(config.swagger.output, "swagger.json"),
    );
  }
  return output;
};

const collectDirectories = async (props: {
  directories: Set<string>;
  ignored: string[];
  target: string;
}): Promise<void> => {
  const stats: fs.Stats | null = await safeStat(props.target);
  if (stats === null) return;
  const root: string = stats.isDirectory()
    ? props.target
    : path.dirname(props.target);
  await iterateDirectories({
    directories: props.directories,
    ignored: props.ignored,
    root,
  });
};

const iterateDirectories = async (props: {
  directories: Set<string>;
  ignored: string[];
  root: string;
}): Promise<void> => {
  const location: string = path.resolve(props.root);
  if (shouldIgnore(location, props.ignored)) return;
  props.directories.add(location);

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(location, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory() === false) continue;
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    await iterateDirectories({
      directories: props.directories,
      ignored: props.ignored,
      root: path.join(location, entry.name),
    });
  }
};

const safeStat = async (location: string): Promise<fs.Stats | null> => {
  try {
    return await fs.promises.stat(location);
  } catch {
    return null;
  }
};

const shouldReact = (props: { event: string; target: string }): boolean => {
  const ext: string = path.extname(props.target).toLowerCase();
  if (SOURCE_EXTENSIONS.has(ext)) return true;
  return props.event === "rename" && ext.length === 0;
};

// `ignored` holds canonical paths, see `canonical`.
const shouldIgnore = (location: string, ignored: string[]): boolean => {
  const target: string = canonical(location);
  return ignored.some(
    (elem) => target === elem || target.startsWith(`${elem}${path.sep}`),
  );
};

// The filesystem decides which spellings name one location, so the nearest
// existing ancestor is resolved to its real path, which holds the case and the
// links the filesystem keeps, and the part that does not exist yet is appended
// as written. An operating-system name says nothing about the case policy of a
// volume, which a mount or a directory may set apart from its neighbors.
const canonical = (location: string): string => {
  const resolved: string = path.resolve(location);
  const rest: string[] = [];
  for (let current: string = resolved; ; ) {
    try {
      return path.join(fs.realpathSync.native(current), ...[...rest].reverse());
    } catch {
      const parent: string = path.dirname(current);
      if (parent === current) return resolved;
      rest.push(path.basename(current));
      current = parent;
    }
  }
};

const staticRoot = (pattern: string): string => {
  const absolute: string = path.resolve(pattern);
  const parsed: path.ParsedPath = path.parse(absolute);
  const segments: string[] = absolute
    .slice(parsed.root.length)
    .split(/[\\/]+/)
    .filter((segment) => segment.length !== 0);
  const stable: string[] = [];
  for (const segment of segments) {
    if (hasGlobMagic(segment)) break;
    stable.push(segment);
  }
  return stable.length === 0 ? parsed.root : path.join(parsed.root, ...stable);
};

const hasGlobMagic = (pattern: string): boolean => /[*?[\]{}]/.test(pattern);

const relative = (location: string): string => {
  const output: string = path.relative(process.cwd(), location);
  return output.length === 0 ? "." : output.split(path.sep).join("/");
};

const printError = (error: unknown): void => {
  let current: unknown = error;
  let depth: number = 0;
  while (current !== undefined && current !== null && depth < 10) {
    const message: string =
      current instanceof Error ? current.message : String(current);
    console.error(
      `${"  ".repeat(depth)}${depth === 0 ? "" : "caused by: "}${message}`,
    );
    if (current instanceof Error && current.cause !== undefined) {
      current = current.cause;
      ++depth;
    } else break;
  }
};

const SOURCE_EXTENSIONS: Set<string> = new Set([
  ".cts",
  ".json",
  ".mts",
  ".ts",
  ".tsx",
]);

const SKIPPED_DIRECTORIES: Set<string> = new Set([
  ".git",
  ".nestia",
  "node_modules",
]);
