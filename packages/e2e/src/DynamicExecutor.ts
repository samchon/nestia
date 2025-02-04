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

      const executor = execute(props)(report)(assert);
      const iterator = iterate(props.extension ?? "js")(executor);
      await iterator(props.location);

      report.time = Date.now() - report.time;
      return report;
    };

  const iterate =
    (extension: string) =>
    <Arguments extends any[]>(
      executor: (path: string, modulo: Module<Arguments>) => Promise<void>,
    ) => {
      const visitor = async (path: string): Promise<void> => {
        const directory: string[] = await fs.promises.readdir(path);
        for (const file of directory) {
          const location: string = NodePath.resolve(`${path}/${file}`);
          const stats: fs.Stats = await fs.promises.lstat(location);

          if (stats.isDirectory() === true) {
            await visitor(location);
            continue;
          } else if (file.substr(-3) !== `.${extension}`) continue;

          const modulo: Module<Arguments> = await import(location);
          await executor(location, modulo);
        }
      };
      return visitor;
    };

  const execute =
    <Arguments extends any[]>(props: IProps<Arguments>) =>
    (report: IReport) =>
    (assert: boolean) =>
    async (location: string, modulo: Module<Arguments>): Promise<void> => {
      for (const [key, closure] of Object.entries(modulo)) {
        if (
          key.substring(0, props.prefix.length) !== props.prefix ||
          typeof closure !== "function" ||
          (props.filter && props.filter(key) === false)
        )
          continue;

        const func = async () => {
          if (props.wrapper !== undefined)
            await props.wrapper(key, closure, props.parameters(key));
          else await closure(...props.parameters(key));
        };

        const result: IExecution = {
          name: key,
          location,
          error: null,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };
        report.executions.push(result);

        try {
          await func();
          result.completed_at = new Date().toISOString();
        } catch (exp) {
          result.error = exp as Error;
          if (assert === true) throw exp;
        } finally {
          result.completed_at = new Date().toISOString();
          if (props.onComplete) props.onComplete(result);
        }
      }
    };

  interface Module<Arguments extends any[]> {
    [key: string]: Closure<Arguments>;
  }
}
