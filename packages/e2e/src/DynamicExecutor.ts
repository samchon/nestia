import fs from "fs";
import NodePath from "path";

/**
 * Dynamic Executor running prefixed functions.
 *
 * `DynamicExecutor` runs every (or some filtered) prefixed functions
 * in a specific directory.
 *
 * For reference, it's useful for test program development of a backend server.
 * Just write test functions under a directory, and just specify it.
 * Furthermore, if you compose e2e test programs to utilize the `@nestia/sdk`
 * generated API functions, you can take advantage of {@link DynamicBenchmarker}
 * at the same time.
 *
 * When you want to see some utilization cases, see the below example links.
 *
 * @example https://github.com/samchon/nestia-start/blob/master/test/index.ts
 * @example https://github.com/samchon/backend/blob/master/test/index.ts
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace DynamicExecutor {
  /**
   * Function type of a prefixed.
   *
   * @template Arguments Type of parameters
   * @template Ret Type of return value
   */
  export interface Closure<Arguments extends any[], Ret = any> {
    (...args: Arguments): Promise<Ret>;
  }

  /**
   * Options for dynamic executor.
   */
  export interface IProps<Parameters extends any[], Ret = any> {
    /**
     * Prefix of function name.
     *
     * Every prefixed function will be executed.
     *
     * In other words, if a function name doesn't start with the prefix, then it would never be executed.
     */
    prefix: string;

    /**
     * Location of the test functions.
     */
    location: string;

    /**
     * Get parameters of a function.
     *
     * @param name Function name
     * @returns Parameters
     */
    parameters: (name: string) => Parameters;

    /**
     * On complete function.
     *
     * Listener of completion of a test function.
     *
     * @param exec Execution result of a test function
     */
    onComplete?: (exec: IExecution) => void;

    /**
     * Filter function whether to run or not.
     *
     * @param name Function name
     * @returns Whether to run or not
     */
    filter?: (name: string) => boolean;

    /**
     * Wrapper of test function.
     *
     * If you specify this `wrapper` property,  every dynamic functions
     * loaded and called by this `DynamicExecutor` would be wrapped by
     * the `wrapper` function.
     *
     * @param name Function name
     * @param closure Function to be executed
     * @param parameters Parameters, result of options.parameters function.
     * @returns Wrapper function
     */
    wrapper?: (
      name: string,
      closure: Closure<Parameters, Ret>,
      parameters: Parameters,
    ) => Promise<any>;

    /**
     * Number of simultaneous requests.
     *
     * The number of requests to be executed simultaneously.
     *
     * If you configure a value greater than one, the dynamic executor will
     * process the functions concurrently with the given capacity value.
     *
     * @default 1
     */
    simultaneous?: number;

    /**
     * Extension of dynamic functions.
     *
     * @default js
     */
    extension?: string;
  }

  /**
   * Report, result of dynamic execution.
   */
  export interface IReport {
    /**
     * Location path of dynamic functions.
     */
    location: string;

    /**
     * Execution results of dynamic functions.
     */
    executions: IExecution[];

    /**
     * Total elapsed time.
     */
    time: number;
  }

  /**
   * Execution of a test function.
   */
  export interface IExecution {
    /**
     * Name of function.
     */
    name: string;

    /**
     * Location path of the function.
     */
    location: string;

    /**
     * Returned value from the function.
     */
    value: unknown;

    /**
     * Error when occurred.
     */
    error: Error | null;

    /**
     * Elapsed time.
     */
    started_at: string;

    /**
     * Completion time.
     */
    completed_at: string;

    /**
     * Context of the test execution.
     */
    context: IContext;
  }

  /**
   * The context of a test execution.
   * @author sunrabbit123 - https://github.com/sunrabbit123
   */
  export interface IContext {
    /**
     * Total number of test functions.
     */
    total: number;

    /**
     * Number of test functions executed.
     *
     * Contains both success and failure.
     */
    executed: number;

    /**
     * Number of test functions failed.
     */
    failed: number;

    /**
     * Number of test functions succeeded.
     */
    succeeded: number;

    /**
     * Start time of the test program.
     */
    started_at: string;
  }

  /**
   * Prepare dynamic executor in strict mode.
   *
   * In strict mode, if any error occurs, the program will be terminated directly.
   * Otherwise, {@link validate} mode does not terminate when error occurs, but
   * just archive the error log.
   *
   * @param props Properties of dynamic execution
   * @returns Report of dynamic test functions execution
   */
  export const assert = <Arguments extends any[]>(
    props: IProps<Arguments>,
  ): Promise<IReport> => main(true)(props);

  /**
   * Prepare dynamic executor in loose mode.
   *
   * In loose mode, the program would not be terminated even when error occurs.
   * Instead, the error would be archived and returns as a list. Otherwise,
   * {@link assert} mode terminates the program directly when error occurs.
   *
   * @param props Properties of dynamic executor
   * @returns Report of dynamic test functions execution
   */
  export const validate = <Arguments extends any[]>(
    props: IProps<Arguments>,
  ): Promise<IReport> => main(false)(props);

  const main =
    (assert: boolean) =>
    async <Arguments extends any[]>(
      props: IProps<Arguments>,
    ): Promise<IReport> => {
      const report: IReport = {
        location: props.location,
        time: Date.now(),
        executions: [],
      };

      const isExecuteTarget = (functionName: string, functionValue: unknown): boolean => {
        return functionName.startsWith(props.prefix) || typeof functionValue === "function" || (typeof props.filter === "function" && props.filter(functionName) === true)
      }
      const executor = execute(props)(report)(assert);
      const processes: Array<() => Promise<void>> = await iterate({
        extension: props.extension ?? "js",
        location: props.location,
        executor,
        isExecuteTarget,
      });
      await Promise.all(
        new Array(props.simultaneous ?? 1).fill(0).map(async () => {
          while (processes.length !== 0) {
            const task = processes.shift();
            await task?.();
          }
        }),
      );
      report.time = Date.now() - report.time;
      return report;
    };

  const iterate = async <Arguments extends any[]>(props: {
    location: string;
    extension: string;
    executor: (path: string, modulo: Module<Arguments>, context: IContext) => Promise<void>;
    isExecuteTarget: (functionName: string, functionValue: unknown) => boolean;
  }): Promise<Array<() => Promise<void>>> => {
    const context: IContext = {
      total: 0,
      executed: 0,
      failed: 0,
      succeeded: 0,
      started_at: new Date().toISOString(),
    };
    const container: Array<() => Promise<void>> = [];
    const visitor = async (path: string): Promise<void> => {
      const directory: string[] = await fs.promises.readdir(path);
      for (const file of directory) {
        const location: string = NodePath.resolve(`${path}/${file}`);
        const stats: fs.Stats = await fs.promises.lstat(location);

        if (stats.isDirectory() === true) {
          await visitor(location);
          continue;
        } else if (file.substr(-3) !== `.${props.extension}`) continue;

        const modulo: Module<Arguments> = await import(location);
        Object.entries(modulo).forEach(([key, closure]) => {
          if (!props.isExecuteTarget(key, closure)) return;
          context.total++;
          container.push(() => props.executor(location, modulo, context));
        });
      }
    };
    await visitor(props.location);
    return container;
  };

  const execute =
    <Arguments extends any[]>(props: IProps<Arguments>) =>
    (report: IReport) =>
    (assert: boolean) =>
    async (location: string, modulo: Module<Arguments>, context: IContext): Promise<void> => {
      for (const [key, closure] of Object.entries(modulo)) {
        const func = () => {
          if (props.wrapper !== undefined)
            return props.wrapper(key, closure, props.parameters(key));
          else return closure(...props.parameters(key));
        };

        const result: IExecution = {
          name: key,
          location,
          value: undefined,
          error: null,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          context,
        };
        report.executions.push(result);

        try {
          result.value = await func();
          result.completed_at = new Date().toISOString();
          context.succeeded++;
        } catch (exp) {
          result.error = exp as Error;
          context.failed++;
          if (assert === true) throw exp;
        } finally {
          context.executed++;
          result.completed_at = new Date().toISOString();

          // copy for immutable
          result.context = { ...context };
          if (props.onComplete) props.onComplete(result);
        }
      }
    };
  interface Module<Arguments extends any[]> {
    [key: string]: Closure<Arguments>;
  }
}
