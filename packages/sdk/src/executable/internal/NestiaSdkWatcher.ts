import fs from "fs";
import { glob } from "glob";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";

export namespace NestiaSdkWatcher {
  export interface IProps {
    configFile: string;
    configurations: () => Promise<INestiaConfig[]>;
    generate: (configurations: INestiaConfig[]) => Promise<void>;
    projectFile: string;
  }

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
      process.exit(0);
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
    let nextReason: string | null = reason;
    do {
      const current: string = nextReason;
      nextReason = null;
      this.pending = null;
      let configurations: INestiaConfig[] = [];
      try {
        if (current === "initial generation")
          console.log("Starting nestia swagger watch mode");
        else console.log(`Change detected (${current}); regenerating swagger`);

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
        await this.refresh(configurations);
        console.error("Nestia swagger watch generation failed:");
        printError(error);
      }
      nextReason = this.pending;
    } while (nextReason !== null && !this.stopped);
    this.running = false;
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
    ignored: [...ignored],
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
    for (const match of await glob(pattern)) output.add(path.resolve(match));
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

const shouldIgnore = (location: string, ignored: string[]): boolean =>
  ignored.some((elem) => isSameOrInside(location, elem));

const isSameOrInside = (child: string, parent: string): boolean => {
  const left: string = comparable(child);
  const right: string = comparable(parent);
  return left === right || left.startsWith(`${right}${path.sep}`);
};

const comparable = (location: string): string => {
  const resolved: string = path.resolve(location);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
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
