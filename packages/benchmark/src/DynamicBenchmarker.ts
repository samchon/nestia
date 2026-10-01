import { IConnection } from "@nestia/fetcher";
import fs from "fs";
import { Driver, WorkerConnector, WorkerServer } from "tgrid";
import { HashMap, hash, sleep_for } from "tstl";

import { IBenchmarkEvent } from "./IBenchmarkEvent";
import { DynamicBenchmarkReporter } from "./internal/DynamicBenchmarkReporter";
import { DynamicBenchmarkStatistics } from "./internal/DynamicBenchmarkStatistics";
import { IBenchmarkMaster } from "./internal/IBenchmarkMaster";
import { IBenchmarkServant } from "./internal/IBenchmarkServant";

/**
 * Dynamic benchmark executor running prefixed functions.
 *
 * `DynamicBenchmarker` is composed with two programs,
 * {@link DynamicBenchmarker.master} and
 * {@link DynamicBenchmarker.servant servants}. The master program creates
 * multiple servant programs, and the servant programs execute the prefixed
 * functions in parallel. When the pre-congirued count of requests are all
 * completed, the master program collects the results and returns them.
 *
 * Therefore, when you want to benchmark the performance of a backend server,
 * you have to make two programs; one for calling the
 * {@link DynamicBenchmarker.master} function, and the other for calling the
 * {@link DynamicBenchmarker.servant} function. Also, never forget to write the
 * path of the servant program to the
 * {@link DynamicBenchmarker.IMasterProps.servant} property.
 *
 * Also, you when you complete the benchmark execution through the
 * {@link DynamicBenchmarker.master} and {@link DynamicBenchmarker.servant}
 * functions, you can convert the result to markdown content by using the
 * {@link DynamicBenchmarker.markdown} function.
 *
 * Additionally, if you hope to see some utilization cases, see the below
 * example tagged links.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   https://github.com/samchon/nestia-start/blob/master/test/benchmaark/index.ts
 *
 * @example
 *   https://github.com/samchon/backend/blob/master/test/benchmark/index.ts
 *
 * @evidence contracts/common.md#principled-implementation The master spawns one child process per thread through tgrid's process-mode `WorkerConnector`, drives each servant over RPC, and merges the returned events; totals are split by floor plus remainder so the shares sum to the requested count and simultaneous budget.
 * @evidence contracts/common.md#clear-and-simple-design One namespace is the public surface (master, servant, markdown, props, report); execution, discovery, and cleanup helpers stay private, and statistics and rendering live in their own internal namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing names a server, feature, or file: the feature extension, prefix, and filter are caller inputs, and the servant path is a property rather than an assumed location.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose explains the two-program model, what each program does, and how to obtain markdown, with links to the member documentation and to example repositories.
 */
export namespace DynamicBenchmarker {
  /**
   * Properties of the master program.
   *
   * @evidence contracts/common.md#principled-implementation The fields are exactly what the master needs to plan a run: totals, parallelism, how to reach the servant program, and optional hooks; the count, threads, and simultaneous constraints are enforced by `master`, which the field prose states.
   * @evidence contracts/common.md#clear-and-simple-design A flat property record; optional members carry the only extension points (filter, progress, memory, stdio).
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is caller-supplied; no default names a target application or fixture.
   * @evidence contracts/common.md#meaningful-documentation Each property documents its meaning and constraints, including how simultaneous is distributed among threads and that the filter receives a file basename.
   */
  export interface IMasterProps {
    /** Total count of the requests. */
    count: number;

    /**
     * Number of threads.
     *
     * The number of threads to be executed as parallel servant.
     */
    threads: number;

    /**
     * Number of simultaneous requests.
     *
     * The number of requests to be executed simultaneously.
     *
     * This property value is distributed among the {@link threads} servants like
     * the {@link count}, so their budgets sum to it. It must not be less than
     * the {@link threads}, as each servant runs at least one request at a time.
     */
    simultaneous: number;

    /**
     * Path of the servant program.
     *
     * The path of the servant program executing the
     * {@link DynamicBenchmarker.servant} function.
     */
    servant: string;

    /**
     * Filter function.
     *
     * The filter function is called with the file name (basename) of each
     * benchmark function module, not with the function name. When it returns
     * `false`, the file would never be imported in the servant, so that every
     * function defined in the file would never be executed either.
     *
     * @param file File name (basename) of the benchmark functions
     * @returns Whether to execute the function or not.
     * @evidence contracts/common.md#principled-implementation The predicate is asked for each candidate file name through the master driver before the servant imports it, so a rejected file's functions can never execute.
     * @evidence contracts/common.md#clear-and-simple-design A single predicate on the file basename, with a default that accepts everything.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection is by the caller's predicate, not by known file names.
     * @evidence contracts/common.md#meaningful-documentation The comment states the argument (basename, not function name) and that a `false` result prevents the import.
     */
    filter?: (file: string) => boolean;

    /**
     * Progress callback function.
     *
     * @param complete The number of completed requests.
     * @evidence contracts/common.md#principled-implementation The callback receives the sum of the completed counts of every servant, so its argument is monotone toward the total and is called once more with the exact count at the end.
     * @evidence contracts/common.md#clear-and-simple-design One optional notification with a single number argument.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback observes the run and cannot alter it.
     * @evidence contracts/common.md#meaningful-documentation The comment names the argument as the number of completed requests.
     */
    progress?: (complete: number) => void;

    /**
     * Get memory usage.
     *
     * Get the memory usage of the master program.
     *
     * Specify this property only when your backend server is running on a
     * different process, so that need to measure the memory usage of the
     * backend server from other process.
     *
     * The function is called once a second while the benchmark runs. If it
     * rejects, the sampling stops and the report keeps the samples taken so
     * far.
     *
     * @evidence contracts/common.md#principled-implementation When the server under test runs in another process, the master's own `process.memoryUsage()` measures the wrong process, so the caller supplies a getter for the right one; it is sampled once a second while the run lasts.
     * @evidence contracts/common.md#clear-and-simple-design One optional async getter that replaces the default sampler and nothing else.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The default measures the master process itself; a caller getter is used as given, and a getter that rejects ends sampling rather than being retried or replaced.
     * @evidence contracts/common.md#meaningful-documentation The comment states when to set it, the sampling cadence, and that a rejection stops the sampling and keeps earlier samples.
     */
    memory?: () => Promise<NodeJS.MemoryUsage>;

    /**
     * Standard I/O option.
     *
     * The standard I/O option for the servant programs.
     */
    stdio?: undefined | "overlapped" | "pipe" | "ignore" | "inherit";
  }

  /**
   * Properties of the servant program.
   *
   * @evidence contracts/common.md#principled-implementation The fields define how a servant finds benchmark functions (location, extension, prefix) and how it builds their arguments (connection and parameters), which is everything discovery and invocation need.
   * @evidence contracts/common.md#clear-and-simple-design A generic property record parameterized by the tuple of function arguments, with the optional extension defaulting to the built JavaScript.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The extension is declared rather than inferred from the servant's own module, which once loaded no feature at all when the library was built and the features ran from TypeScript source.
   * @evidence contracts/common.md#meaningful-documentation Each property documents its role, the default extension, the file-name and function-name prefix rules, and what happens when nothing matches.
   */
  export interface IServantProps<Parameters extends any[]> {
    /**
     * Default connection.
     *
     * Default connection to be used in the servant.
     */
    connection: IConnection;

    /** Location of the benchmark functions. */
    location: string;

    /**
     * Extension of the benchmark function files to load, without the leading
     * dot.
     *
     * The servant reads {@link location} and imports every file ending with this
     * extension. Set it to match how the feature files are actually run: `"js"`
     * when they are built JavaScript, or `"ts"` when they are executed from
     * TypeScript source (for example under `ttsx`).
     *
     * @default "js"
     */
    extension?: string;

    /**
     * Prefix of the benchmark functions.
     *
     * Every prefixed function will be executed in the servant.
     *
     * In other words, if a function name doesn't start with the prefix, then it
     * would never be executed. Also, when a file name (basename) does not start
     * with the prefix, the file would never be imported either, so that every
     * function defined in the file would never be executed.
     *
     * When no function matches, no request is executed and the report carries
     * no events.
     */
    prefix: string;

    /**
     * Get parameters of a function.
     *
     * When composing the parameters, never forget to copy the
     * {@link IConnection.logger} property of default connection to the returning
     * parameters.
     *
     * @param connection Default connection instance
     * @param name Function name
     * @evidence contracts/common.md#principled-implementation A function from the per-request connection and the function name to the argument tuple lets each execution receive a connection whose logger records its events.
     * @evidence contracts/common.md#clear-and-simple-design One callback, called per execution, with the two inputs a caller needs to build arguments.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Arguments come only from the caller's function; the connection it receives is the servant's logging copy.
     * @evidence contracts/common.md#meaningful-documentation The comment warns that the logger of the received connection must be carried into the returned parameters, the fact that decides whether events are recorded.
     */
    parameters: (connection: IConnection, name: string) => Parameters;
  }

  /**
   * Benchmark report.
   *
   * Times are ISO 8601 strings, durations are milliseconds, and the
   * {@link statistics} and every entry of {@link endpoints} describe the same
   * collected events, grouped by method and path template.
   *
   * @evidence contracts/common.md#principled-implementation The report is the master's merged observation: the run parameters, whole-run statistics, per-endpoint statistics, and memory samples, all derived from one event collection.
   * @evidence contracts/common.md#clear-and-simple-design A flat record whose nested types (`IEndpoint`, `IStatistics`, `IMemory`) name the parts, with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is measured or copied from the request; none is a fixture value.
   * @evidence contracts/common.md#meaningful-documentation The prose states the time format, the duration unit, and how statistics and endpoints relate.
   */
  export interface IReport {
    count: number;
    threads: number;
    simultaneous: number;
    started_at: string;
    completed_at: string;
    statistics: IReport.IStatistics;
    endpoints: Array<IReport.IEndpoint & IReport.IStatistics>;
    memories: IReport.IMemory[];
  }
  export namespace IReport {
    /**
     * Identity of an endpoint in the report: the HTTP method and the route
     * path, using the path template when the route declares one.
     *
     * @evidence contracts/common.md#principled-implementation An endpoint is identified by method and path, the pair the master groups events by, with the template preferred so parameterized paths aggregate.
     * @evidence contracts/common.md#clear-and-simple-design Two string fields with no behavior.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Grouping uses the route metadata carried by each event, without a list of known endpoints.
     * @evidence contracts/common.md#meaningful-documentation The comment states which path form is used for grouping.
     */
    export interface IEndpoint {
      method: string;
      path: string;
    }
    /**
     * Statistics of a set of benchmarked requests.
     *
     * Durations are milliseconds from the request start to its completion.
     * `mean`, `stdev`, `minimum`, and `maximum` are `null` when there are no
     * events, and `stdev` is the population standard deviation. `success`
     * counts the events whose executed function did not throw.
     *
     * @evidence contracts/common.md#principled-implementation Counts are exact, the mean and population standard deviation are computed over the same set, and `null` marks the empty set where no value is defined.
     * @evidence contracts/common.md#clear-and-simple-design A flat record of six measures reused for the whole run and for each endpoint.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are computed from the events; no measure is defaulted to a plausible number.
     * @evidence contracts/common.md#meaningful-documentation The comment states the unit, the empty-set convention, the deviation kind, and what success counts.
     */
    export interface IStatistics {
      count: number;
      success: number;
      mean: number | null;
      stdev: number | null;
      minimum: number | null;
      maximum: number | null;
    }
    /**
     * One memory sample taken while the benchmark ran: an ISO 8601 time and the
     * process memory usage read by the sampler.
     *
     * @evidence contracts/common.md#principled-implementation A sample pairs the instant with the usage object exactly as the getter returned it, so the report keeps Node's own fields.
     * @evidence contracts/common.md#clear-and-simple-design Two fields with no behavior.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The usage is the getter's return value, not a synthesized reading.
     * @evidence contracts/common.md#meaningful-documentation The comment states the time format and the source of the usage.
     */
    export interface IMemory {
      time: string;
      usage: NodeJS.MemoryUsage;
    }
  }

  /**
   * Master program.
   *
   * Creates a master program that executing the servant programs in parallel.
   *
   * Note that, {@link IMasterProps.servant} property must be the path of the
   * servant program executing the {@link servant} function.
   *
   * The servants are child processes. When a servant fails to connect or to
   * execute, every servant is closed before the returned promise rejects.
   *
   * @param props Properties of the master program
   * @returns Benchmark report
   * @evidence contracts/common.md#principled-implementation Inputs are validated as safe integers before any process starts; totals are distributed by floor plus remainder; servants execute concurrently and every event is grouped by method and path template in a hash map; every spawned servant is closed on success and on failure, and the memory sampler stops when the run ends.
   * @evidence contracts/common.md#clear-and-simple-design One function owns the run and keeps the sequence readable: validate, spawn, sample, execute, close, aggregate; statistics come from `DynamicBenchmarkStatistics` and the closing helper is shared by the failure and success paths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A servant that fails to close cannot alter a finished report and is not allowed to hide the run's own error, so closing failures are dropped on purpose; no other error is swallowed except a rejecting memory getter, which ends sampling as documented.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the master does, that the servant property must name the servant program, that servants are child processes, and that every servant is closed before a failure rejects.
   */
  export const master = async (props: IMasterProps): Promise<IReport> => {
    if (!Number.isSafeInteger(props.count) || props.count < 0)
      throw new Error(
        "DynamicBenchmarker.master(): count must be a non-negative integer.",
      );
    if (!Number.isSafeInteger(props.threads) || props.threads <= 0)
      throw new Error(
        "DynamicBenchmarker.master(): threads must be a positive integer.",
      );
    if (!Number.isSafeInteger(props.simultaneous) || props.simultaneous <= 0)
      throw new Error(
        "DynamicBenchmarker.master(): simultaneous must be a positive integer.",
      );
    if (props.simultaneous < props.threads)
      throw new Error(
        `DynamicBenchmarker.master(): simultaneous (${props.simultaneous}) must not be less than threads (${props.threads}), as each servant runs at least one request at a time.`,
      );
    const completes: number[] = new Array(props.threads).fill(0);
    // the first `total % threads` servants take one more than the rest, so the
    // shares sum to the total
    const distribute = (total: number): number[] =>
      new Array(props.threads)
        .fill(0)
        .map(
          (_, index) =>
            Math.floor(total / props.threads) +
            (index < total % props.threads ? 1 : 0),
        );
    const counts: number[] = distribute(props.count);
    const budgets: number[] = distribute(props.simultaneous);
    // every servant is a child process, so each connector created must be
    // closed on every path out of this function, including a failed connection
    // of a sibling
    const spawned: Servant[] = [];
    const settled: PromiseSettledResult<void>[] = await Promise.allSettled(
      new Array(props.threads).fill(null).map(async (_, i) => {
        const connector: Servant = new WorkerConnector(
          null,
          {
            filter: props.filter ?? (() => true),
            progress: (current) => {
              completes[i] = current;
              if (props.progress)
                props.progress(completes.reduce((a, b) => a + b, 0));
            },
          },
          "process",
        );
        spawned.push(connector);
        await connector.connect(props.servant, { stdio: props.stdio });
      }),
    );
    const refused: PromiseRejectedResult | undefined = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (refused !== undefined) {
      await closeAll(spawned);
      throw refused.reason;
    }
    const servants: Servant[] = spawned;

    const started_at: Date = new Date();
    const memories: IReport.IMemory[] = [];
    const sampler: { active: boolean } = { active: true };
    let completed_at: Date;
    let events: IBenchmarkEvent[];

    // one sample a second until the run ends; a getter that rejects stops the
    // sampling and keeps the samples taken so far
    (async () => {
      const getter = props.memory ?? (async () => process.memoryUsage());
      for (;;) {
        await sleep_for(1_000);
        if (sampler.active === false) break;
        memories.push({
          usage: await getter(),
          time: new Date().toISOString(),
        });
      }
    })().catch(() => {});

    try {
      events = (
        await Promise.all(
          servants.map((connector, index) =>
            connector.getDriver().execute({
              count: counts[index]!,
              simultaneous: budgets[index]!,
            }),
          ),
        )
      ).flat();
      completed_at = new Date();
    } finally {
      sampler.active = false;
      await closeAll(servants);
    }
    if (props.progress) props.progress(props.count);

    const endpoints: HashMap<IReport.IEndpoint, IBenchmarkEvent[]> =
      new HashMap(
        (key) => hash(key.method, key.path),
        (x, y) => x.method === y.method && x.path === y.path,
      );
    for (const e of events)
      endpoints
        .take(
          {
            method: e.metadata.method,
            path: e.metadata.template ?? e.metadata.path,
          },
          () => [],
        )
        .push(e);
    return {
      count: props.count,
      threads: props.threads,
      simultaneous: props.simultaneous,
      statistics: DynamicBenchmarkStatistics.of(events),
      endpoints: [...endpoints].map((it) => ({
        ...DynamicBenchmarkStatistics.of(it.second),
        ...it.first,
      })),
      started_at: started_at.toISOString(),
      completed_at: completed_at.toISOString(),
      memories,
    };
  };

  /**
   * Create a servant program.
   *
   * Creates a servant program executing the prefixed functions in parallel.
   *
   * @param props Properties of the servant program
   * @returns Servant program as a worker server
   * @evidence contracts/common.md#principled-implementation A servant opens a `WorkerServer` that exposes one `execute` operation; the master decides counts and budgets, so the servant only needs the location and naming rules to find functions.
   * @evidence contracts/common.md#clear-and-simple-design A thin adapter over the worker server whose behavior lives in the private `execute` and `iterate` helpers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery is driven by the caller's location, extension, and prefix, and by the master's filter; no file or function name is assumed.
   * @evidence contracts/common.md#meaningful-documentation The comment states that it creates the servant program and returns it as a worker server.
   */
  export const servant = async <Parameters extends any[]>(
    props: IServantProps<Parameters>,
  ): Promise<WorkerServer<null, IBenchmarkServant, IBenchmarkMaster>> => {
    const server: WorkerServer<null, IBenchmarkServant, IBenchmarkMaster> =
      new WorkerServer();
    await server.open({
      execute: execute({
        driver: server.getDriver(),
        props,
      }),
    });
    return server;
  };

  /**
   * Convert the benchmark report to markdown content.
   *
   * @param report Benchmark report
   * @returns Markdown content
   * @evidence contracts/common.md#principled-implementation Rendering is a pure function of the report and a few host facts, delegated to the reporter so the report type and its presentation stay separate.
   * @evidence contracts/common.md#clear-and-simple-design A one-line delegation that gives users a single entry point without exposing the internal reporter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The function only formats; it does not alter the report.
   * @evidence contracts/common.md#meaningful-documentation The comment states input and output: a report in, markdown content out.
   */
  export const markdown = (report: DynamicBenchmarker.IReport): string =>
    DynamicBenchmarkReporter.markdown(report);

  const execute =
    <Parameters extends any[]>(ctx: {
      driver: Driver<IBenchmarkMaster>;
      props: IServantProps<Parameters>;
    }) =>
    async (mass: {
      count: number;
      simultaneous: number;
    }): Promise<IBenchmarkEvent[]> => {
      const functions: IFunction<Parameters>[] = [];
      await iterate({
        collection: functions,
        driver: ctx.driver,
        props: ctx.props,
      })(ctx.props.location);

      const entireEvents: IBenchmarkEvent[] = [];
      let scheduled: number = 0;
      await Promise.all(
        new Array(mass.simultaneous)
          .fill(null)
          .map(() => 1)
          .map(async () => {
            while (scheduled < mass.count) {
              ++scheduled;
              const localEvents: IBenchmarkEvent[] = [];
              const func: IFunction<Parameters> =
                functions[Math.floor(Math.random() * functions.length)]!;
              const connection: IConnection = {
                ...ctx.props.connection,
                logger: async (fe): Promise<void> => {
                  const be: IBenchmarkEvent = {
                    metadata: fe.route,
                    status: fe.status,
                    started_at: fe.started_at.toISOString(),
                    respond_at: fe.respond_at?.toISOString() ?? null,
                    completed_at: fe.completed_at.toISOString(),
                    success: true,
                  };
                  localEvents.push(be);
                  entireEvents.push(be);
                },
              };
              try {
                await func.value(...ctx.props.parameters(connection, func.key));
              } catch (exp) {
                for (const e of localEvents) e.success = false;
              }
              if (localEvents.length !== 0)
                ctx.driver.progress(entireEvents.length).catch(() => {});
            }
          }),
      );
      await ctx.driver.progress(entireEvents.length);
      return entireEvents;
    };
}

type Servant = WorkerConnector<null, IBenchmarkMaster, IBenchmarkServant>;

// A servant that fails to close cannot change a finished report, and must not
// hide the error that ended the run, so a failed close is dropped.
const closeAll = async (servants: Servant[]): Promise<void> => {
  await Promise.allSettled(servants.map((connector) => connector.close()));
};

interface IFunction<Parameters extends any[]> {
  key: string;
  value: (...args: Parameters) => Promise<void>;
}

const iterate =
  <Parameters extends any[]>(ctx: {
    collection: IFunction<Parameters>[];
    driver: Driver<IBenchmarkMaster>;
    props: DynamicBenchmarker.IServantProps<Parameters>;
  }) =>
  async (path: string): Promise<void> => {
    const directory: string[] = await fs.promises.readdir(path);
    for (const file of directory) {
      const location: string = `${path}/${file}`;
      const stat: fs.Stats = await fs.promises.stat(location);
      if (stat.isDirectory() === true) await iterate(ctx)(location);
      // Load feature files whose extension matches `props.extension`. This is
      // configurable instead of inferred from the servant's own module
      // extension, because the benchmark library may be built (`.js`) while the
      // feature files it drives are run from source (`.ts`, e.g. under `ttsx`);
      // inferring would look for `.js` features that do not exist, load
      // nothing, and spin forever.
      else if (
        file.endsWith(`.${ctx.props.extension ?? "js"}`) &&
        file.endsWith(".d.ts") === false
      ) {
        // GATE BY FILE NAME (PREFIX & FILTER), SO THAT EXCLUDED FILES ARE
        // NEVER IMPORTED.
        if (file.startsWith(ctx.props.prefix) === false) continue;
        if ((await ctx.driver.filter(file)) === false) continue;
        const modulo = await import(location);
        for (const [key, value] of Object.entries(modulo)) {
          if (typeof value !== "function") continue;
          else if (key.startsWith(ctx.props.prefix) === false) continue;
          ctx.collection.push({
            key,
            value: value as (...args: Parameters) => Promise<any>,
          });
        }
      }
    }
  };
