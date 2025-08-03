import { IConnection } from "@nestia/fetcher";
import fs from "fs";
import { Driver, WorkerConnector, WorkerServer } from "tgrid";
import { HashMap, hash, sleep_for } from "tstl";

import { IBenchmarkEvent } from "./IBenchmarkEvent";
import { DynamicBenchmarkReporter } from "./internal/DynamicBenchmarkReporter";
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
 */
export namespace DynamicBenchmarker {
  /** Properties of the master program. */
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
     * This property value would be divided by the {@link threads} in the
     * servants.
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
     * The filter function to determine whether to execute the function in the
     * servant or not.
     *
     * @param name Function name
     * @returns Whether to execute the function or not.
     */
    filter?: (name: string) => boolean;

    /**
     * Progress callback function.
     *
     * @param complete The number of completed requests.
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
     */
    memory?: () => Promise<NodeJS.MemoryUsage>;

    /**
     * Standard I/O option.
     *
     * The standard I/O option for the servant programs.
     */
    stdio?: undefined | "overlapped" | "pipe" | "ignore" | "inherit";
  }

  /** Properties of the servant program. */
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
     * Prefix of the benchmark functions.
     *
     * Every prefixed function will be executed in the servant.
     *
     * In other words, if a function name doesn't start with the prefix, then it
     * would never be executed.
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
     */
    parameters: (connection: IConnection, name: string) => Parameters;
  }

  /** Benchmark report. */
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
    export interface IEndpoint {
      method: string;
      path: string;
    }
    export interface IStatistics {
      count: number;
      success: number;
      mean: number | null;
      stdev: number | null;
      minimum: number | null;
      maximum: number | null;
    }
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
   * @param props Properties of the master program
   * @returns Benchmark report
   */
  export const master = async (props: IMasterProps): Promise<IReport> => {
    const completes: number[] = new Array(props.threads).fill(0);
    const servants: WorkerConnector<
      null,
      IBenchmarkMaster,
      IBenchmarkServant
    >[] = await Promise.all(
      new Array(props.threads).fill(null).map(async (_, i) => {
        const connector: WorkerConnector<
          null,
          IBenchmarkMaster,
          IBenchmarkServant
        > = new WorkerConnector(
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
        await connector.connect(props.servant, { stdio: props.stdio });
        return connector;
      }),
    );

    const started_at: Date = new Date();
    const memories: IReport.IMemory[] = [];
    let completed_at: Date | null = null;

    (async () => {
      const getter = props.memory ?? (async () => process.memoryUsage());
      while (completed_at === null) {
        await sleep_for(1_000);
        memories.push({
          usage: await getter(),
          time: new Date().toISOString(),
        });
      }
    })().catch(() => {});

    const events: IBenchmarkEvent[] = (
      await Promise.all(
        servants.map((connector) =>
          connector.getDriver().execute({
            count: Math.ceil(props.count / props.threads),
            simultaneous: Math.ceil(props.simultaneous / props.threads),
          }),
        ),
      )
    ).flat();

    completed_at = new Date();
    await Promise.all(servants.map((connector) => connector.close()));
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
      statistics: statistics(events),
      endpoints: [...endpoints].map((it) => ({
        ...statistics(it.second),
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
      await Promise.all(
        new Array(mass.simultaneous)
          .fill(null)
          .map(() => 1)
          .map(async () => {
            while (entireEvents.length < mass.count) {
              const localEvents: IBenchmarkEvent[] = [];
              const func: IFunction<Parameters> =
                functions[Math.floor(Math.random() * functions.length)];
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
                for (const e of localEvents)
                  e.success = e.status === 200 || e.status === 201;
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
      else if (file.endsWith(".js") === true) {
        const modulo = await import(location);
        for (const [key, value] of Object.entries(modulo)) {
          if (typeof value !== "function") continue;
          else if (key.startsWith(ctx.props.prefix) === false) continue;
          else if ((await ctx.driver.filter(key)) === false) continue;
          ctx.collection.push({
            key,
            value: value as (...args: Parameters) => Promise<any>,
          });
        }
      }
    }
  };

const statistics = (
  events: IBenchmarkEvent[],
): DynamicBenchmarker.IReport.IStatistics => {
  const successes: IBenchmarkEvent[] = events.filter((event) => event.success);
  return {
    count: events.length,
    success: successes.length,
    ...average(events),
  };
};

const average = (
  events: IBenchmarkEvent[],
): Pick<
  DynamicBenchmarker.IReport.IStatistics,
  "mean" | "stdev" | "minimum" | "maximum"
> => {
  if (events.length === 0)
    return {
      mean: null,
      stdev: null,
      minimum: null,
      maximum: null,
    };
  let mean: number = 0;
  let stdev: number = 0;
  let minimum: number = Number.MAX_SAFE_INTEGER;
  let maximum: number = Number.MIN_SAFE_INTEGER;
  for (const event of events) {
    const elapsed: number =
      new Date(event.completed_at).getTime() -
      new Date(event.started_at).getTime();
    mean += elapsed;
    stdev += elapsed * elapsed;
    minimum = Math.min(minimum, elapsed);
    maximum = Math.max(maximum, elapsed);
  }
  mean /= events.length;
  stdev = Math.sqrt(stdev / events.length - mean * mean);
  return { mean, stdev, minimum, maximum };
};
