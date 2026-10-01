import cp from "child_process";
import fs from "fs";
import path from "path";

import { INestiaConfig } from "../../INestiaConfig";
import { NestiaSdkApplication } from "../../NestiaSdkApplication";
import { TemporaryDirectory } from "../../utils/TemporaryDirectory";
import { NestiaConfigLoader } from "./NestiaConfigLoader";

/**
 * Owns one disposable Swagger generation process and its two-phase protocol.
 *
 * Configuration functions and controller classes stay in their original Node
 * realm. Only path information reaches the watcher; generation waits until the
 * watcher has installed its watches and explicitly starts the second phase.
 *
 * @evidence contracts/common.md#principled-implementation A child loads configuration and controllers in one realm, sends only a path projection, and waits for the parent's generate message before writing artifacts. Ending that realm releases both CommonJS and ESM module retention without altering a loader cache.
 * @evidence contracts/common.md#clear-and-simple-design One open operation returns the prepared watch plan and generation/close callbacks; the same emitted module owns the child entry so source and installed builds share one protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary configuration functions execute normally in the child; none is stringified, cloned or replaced. No foreign module cache or resolver is changed.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the realm boundary and why artifact generation waits for the watcher handshake.
 * @evidence contracts/portability.md#os-neutral-implementation Node launches this emitted module with its own executable, argument arrays, explicit cwd, IPC and windowsHide. Paths remain native filesystem values and no executable shim or shell command is constructed.
 * @evidence contracts/performance.md#efficient-algorithms Each generation creates one child and projects only the configuration paths required by watcher planning; no controller/module graph is copied into the parent.
 * @evidence contracts/performance.md#reuse-equivalent-work Configuration loading and generation share one child and its loaded configuration objects. Changed inputs require a new realm, while the inherited native compiler caches remain reusable outside its disposable outputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent owns one child per opened generation and awaits its exit on success, failure or close. The child explicitly releases its registered temporary outputs before exit; process exit also releases its module realm.
 */
export namespace NestiaSwaggerWatch {
  /**
   * A prepared child whose configurations contain only watcher path data.
   *
   * @evidence contracts/common.md#principled-implementation The projection is sufficient for watch planning, while callbacks retain the actual child that owns nonserializable configuration functions and controller classes.
   * @evidence contracts/common.md#clear-and-simple-design The record exposes the prepared plan, the explicit generation phase and idempotent release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The projection is never passed to a generator as a replacement configuration; the child's original objects drive generation.
   * @evidence contracts/common.md#meaningful-documentation Member comments distinguish watcher-only data, phase ordering and release ownership.
   * @evidence contracts/portability.md#os-neutral-implementation The configuration projection carries native input/output paths; the callbacks hide Node's IPC and process representation from the watcher instead of exposing a shell or executable shim.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no computation; open and its callbacks own projection and process coordination.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record carries a prepared generation but makes no reuse decision; open keeps its configuration and generator in the same child.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The record transfers one prepared child's lifetime to its caller, which must invoke generate or close and finalize on errors. close is idempotent and waits for worker resource release.
   */
  export interface IGeneration {
    /** Paths used only to install watches, never to generate artifacts. */
    configurations: INestiaConfig[];

    /**
     * Starts generation after the caller installs its watchers.
     *
     * @evidence contracts/common.md#principled-implementation The callback starts the prepared child’s second phase and resolves only after the result and child exit are observed.
     * @evidence contracts/common.md#clear-and-simple-design One argument-free phase transition uses the configuration already held by the child.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It invokes the actual child generator without substituting projected watcher data for its configuration.
     * @evidence contracts/common.md#meaningful-documentation The comment states the required watcher-installation ordering.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature hides the process representation; open owns the Node fork and IPC boundary.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The signature selects no computation; open and the child generator own it.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature decides no sharing policy; the prepared child retains the actual configuration.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no resource; the record’s owner must invoke this operation or close as documented.
     */
    generate: () => Promise<void>;

    /**
     * Ends the child and waits for its owned resources to be released. A
     * synchronous compiler or user callback delays processing the disconnect;
     * release waits for that work rather than abandoning its outputs.
     *
     * @evidence contracts/common.md#principled-implementation The callback disconnects an active child once and joins its actual exit, including a reported cleanup failure.
     * @evidence contracts/common.md#clear-and-simple-design One release operation is shared by cancellation and failure paths.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It waits for owned child cleanup rather than changing foreign loader caches.
     * @evidence contracts/common.md#meaningful-documentation The comment states release timing and the limitation imposed by synchronous child work.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation This callback signature hides Node IPC disconnection; open owns its platform boundary.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The signature performs no cleanup algorithm itself; open defines the implementation.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no producer reuse; open makes release idempotent.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no resource itself; the prepared record and open operation define child lifetime transfer and release.
     */
    close: () => Promise<void>;
  }

  /**
   * Loads one watch plan in a fresh child without starting generation.
   *
   * @evidence contracts/common.md#principled-implementation A prepared IPC message resolves the plan; generate sends the second-phase request and awaits both its result and actual process exit. An early exit or process/IPC error rejects rather than certifying generation.
   * @evidence contracts/common.md#clear-and-simple-design Preparation, generation result and exit have distinct promises, and one close callback joins resource release on every path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The emitted child entry executes real loader and generator operations once. Failures retain their cause messages; no retry or cached-success substitution occurs.
   * @evidence contracts/common.md#meaningful-documentation The comment states that preparation does not write generated artifacts and the returned callbacks define the two-phase lifetime.
   * @evidence contracts/portability.md#os-neutral-implementation Node launches the existing emitted __filename with its own executable, inherited runtime arguments, explicit cwd, windowsHide and IPC; cancellation uses channel disconnection and awaits actual close without platform shell commands.
   * @evidence contracts/performance.md#efficient-algorithms One child is opened for one generation and one path-only projection is delivered; retained parent protocol state is constant apart from that configuration list and bounded error causes.
   * @evidence contracts/performance.md#reuse-equivalent-work The child's loaded configuration is reused for the second phase after watches are installed, so callbacks and controller dependencies are not reconstructed or recompiled between preparation and generation. A changed-input generation needs a fresh realm; compiler disk caches are inherited separately.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation errors close the child before rejection; generation awaits its result and close, and the explicit close callback joins cleanup on cancellation or failure before the second phase. Watcher finalization releases the record after every run and on stop.
   */
  export const open = async (props: {
    configFile: string;
    projectFile: string;
    signal?: AbortSignal;
  }): Promise<IGeneration> => {
    const child = cp.spawn(
      process.execPath,
      [...workerExecArgv(), __filename],
      {
        cwd: process.cwd(),
        stdio: ["inherit", "inherit", "inherit", "ipc"],
        windowsHide: true,
        env: { ...process.env, NESTIA_WATCH_CHILD: "1" },
      },
    );
    let resolvePrepared!: (value: INestiaConfig[]) => void;
    let rejectPrepared!: (error: Error) => void;
    let resolveGenerated!: () => void;
    let rejectGenerated!: (error: Error) => void;
    const prepared = new Promise<INestiaConfig[]>((resolve, reject) => {
      resolvePrepared = resolve;
      rejectPrepared = reject;
    });
    const generated = new Promise<void>((resolve, reject) => {
      resolveGenerated = resolve;
      rejectGenerated = reject;
    });
    // Preparation can fail before the caller awaits the generation phase.
    generated.catch(() => {});
    let ended = false;
    let closing = false;
    let spawned = false;
    let failure: Error | undefined;
    let closeFailure: Error | undefined;
    const fail = (error: Error): void => {
      failure ??= error;
      rejectPrepared(error);
      rejectGenerated(error);
    };
    const exited = new Promise<void>((resolve) => {
      child.once("spawn", () => {
        spawned = true;
      });
      child.once("error", () => {
        if (!spawned) {
          ended = true;
          resolve();
        }
      });
      child.once("exit", (code, signal) => {
        ended = true;
        if (
          closing &&
          failure === undefined &&
          (code !== 0 || signal !== null)
        ) {
          closeFailure = new Error(
            `Swagger generation cleanup exited: ${signal ?? code}`,
          );
          fail(closeFailure);
        } else if (!closing && (code !== 0 || signal !== null))
          fail(
            new Error(`Swagger generation process exited: ${signal ?? code}`),
          );
        else if (!closing) {
          rejectPrepared(
            new Error("Swagger generation exited before preparation."),
          );
          rejectGenerated(
            new Error("Swagger generation exited before reporting its result."),
          );
        }
        resolve();
      });
    });
    child.on("error", fail);
    child.on("message", (message: any) => {
      if (message?.type === "prepared") resolvePrepared(message.configurations);
      else if (message?.type === "complete") resolveGenerated();
      else if (message?.type === "failed")
        fail(deserializeError(message.error));
    });
    const send = (message: object): void => {
      if (!child.connected) {
        fail(new Error("Swagger generation IPC channel is closed."));
        return;
      }
      child.send(message, (error) => {
        if (error) fail(error);
      });
    };
    const close = async (): Promise<void> => {
      if (!ended && !closing) {
        closing = true;
        rejectGenerated(new Error("Swagger generation was cancelled."));
        // Disconnect is the child's cancellation boundary, including failure
        // between watch-plan preparation and the generation handshake.
        if (child.connected) child.disconnect();
      }
      await exited;
      if (closeFailure) throw closeFailure;
    };
    const abort = (): void => {
      const error = new Error("Swagger generation was cancelled.");
      error.name = "AbortError";
      rejectPrepared(error);
      rejectGenerated(error);
      void close().catch(fail);
    };
    props.signal?.addEventListener("abort", abort, { once: true });
    void exited.then(() => props.signal?.removeEventListener("abort", abort));
    if (props.signal?.aborted) abort();
    else
      send({
        type: "prepare",
        configFile: props.configFile,
        projectFile: props.projectFile,
      });
    try {
      const configurations = await prepared;
      return {
        configurations,
        generate: async () => {
          send({ type: "generate" });
          try {
            await generated;
            await exited;
            if (failure) throw failure;
          } finally {
            await close();
          }
        },
        close,
      };
    } catch (error) {
      await close();
      throw error;
    }
  };
}

const serializeError = (error: unknown, depth = 0): any => ({
  message: error instanceof Error ? error.message : String(error),
  cause:
    error instanceof Error && error.cause !== undefined && depth < 10
      ? serializeError(error.cause, depth + 1)
      : undefined,
});

const deserializeError = (error: any): Error =>
  new Error(error?.message ?? "Swagger generation failed.", {
    cause:
      error?.cause === undefined ? undefined : deserializeError(error.cause),
  });

const projectConfigurations = (
  configurations: INestiaConfig[],
): INestiaConfig[] =>
  configurations.map((config) => ({
    input:
      typeof config.input === "function"
        ? fs.existsSync(path.resolve("src"))
          ? path.resolve("src")
          : process.cwd()
        : config.input,
    output: config.output,
    e2e: config.e2e,
    distribute: config.distribute,
    swagger:
      config.swagger === undefined
        ? undefined
        : { output: config.swagger.output },
  }));

// Preserve runtime flags and preloads. Eval/print/input-mode switches select
// the parent's entry rather than this emitted child file. Inspector flags are
// negated last, including those inherited through NODE_OPTIONS, so children do
// not compete for the parent's debug port or wait for another debugger.
const workerExecArgv = (): string[] => {
  const output: string[] = [];
  for (let index = 0; index < process.execArgv.length; ++index) {
    const argument = process.execArgv[index]!;
    if (["-e", "--eval", "-p", "--print", "--input-type"].includes(argument)) {
      ++index;
      continue;
    }
    if (/^--(?:eval|print|input-type)=/.test(argument)) continue;
    if (["-c", "--check", "--test"].includes(argument)) continue;
    output.push(argument);
  }
  return [
    ...output,
    ...["--no-inspect", "--no-inspect-brk", "--no-inspect-wait"].filter(
      (flag) => process.allowedNodeEnvironmentFlags.has(flag),
    ),
  ];
};

const childMain = (): void => {
  let configurations: INestiaConfig[] | undefined;
  let running = false;
  const finish = (code: number): never => {
    try {
      TemporaryDirectory.dispose();
    } catch (error) {
      console.error(error);
      code = 1;
    }
    process.exit(code);
  };
  const reply = (message: object, exitCode?: number): void => {
    if (!process.connected) finish(0);
    process.send!(message, (error) => {
      if (error) {
        if (!process.connected) finish(0);
        console.error(error);
        finish(1);
      }
      if (exitCode !== undefined) finish(exitCode);
    });
  };
  process.once("disconnect", () => finish(0));
  process.on("message", (message: any) => {
    if (running) return;
    running = true;
    void (async () => {
      try {
        if (message?.type === "prepare") {
          process.env.NESTIA_PROJECT = message.projectFile;
          const options = await NestiaConfigLoader.compilerOptions(
            message.projectFile,
          );
          configurations = await NestiaConfigLoader.configurations(
            message.configFile,
            options.raw.compilerOptions ?? {},
          );
          reply({
            type: "prepared",
            configurations: projectConfigurations(configurations),
          });
        } else if (
          message?.type === "generate" &&
          configurations !== undefined
        ) {
          if (
            configurations.length > 1 &&
            !configurations.some((config) => !!config.swagger?.output)
          )
            throw new Error(
              "Every configurations are invalid to generate Swagger Document, configure INestiaConfig.swagger property.",
            );
          for (const config of configurations) {
            if (configurations.length > 1 && !config.swagger?.output) continue;
            await new NestiaSdkApplication(config).swagger();
          }
          TemporaryDirectory.dispose();
          reply({ type: "complete" }, 0);
        } else throw new Error("Invalid Swagger watch generation protocol.");
      } catch (error) {
        try {
          TemporaryDirectory.dispose();
        } catch (cleanup) {
          console.error(cleanup);
        }
        reply({ type: "failed", error: serializeError(error) }, 1);
      } finally {
        running = false;
      }
    })();
  });
};

if (require.main === module && process.env.NESTIA_WATCH_CHILD === "1")
  childMain();
