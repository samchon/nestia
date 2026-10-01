import fs from "fs";
import NodePath from "path";
import { pathToFileURL } from "url";

/**
 * Dynamic Executor running prefixed functions.
 *
 * `DynamicExecutor` runs every (or some filtered) prefixed functions in a
 * specific directory.
 *
 * For reference, it's useful for test program development of a backend server.
 * Just write test functions under a directory, and just specify it.
 * Furthermore, if you compose e2e test programs to utilize the `@nestia/sdk`
 * generated API functions, you can take advantage of {@link DynamicBenchmarker}
 * at the same time.
 *
 * When you want to see some utilization cases, see the below example links.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @example
 *   https://github.com/samchon/nestia-start/blob/master/test/index.ts
 *
 * @example
 *   https://github.com/samchon/backend/blob/master/test/index.ts
 *
 * @evidence contracts/common.md#principled-implementation The executor walks the location recursively, admits a file only when its basename ends with the extension and starts with the prefix and the filter accepts it, imports the admitted files, and runs every exported function whose name starts with the prefix, with at most `simultaneous` runs in flight; the file gate runs before the import so an excluded file is never loaded.
 * @evidence contracts/common.md#clear-and-simple-design Two public entry points share one private pipeline: discovery (`iterate`), the import specifier (`specifier`), and execution (`execute`) are separate helpers, and the two modes differ by one flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection is by prefix, extension, and the caller's filter, with no known file names; the import specifier logic distinguishes the module system in use rather than special-casing a platform.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose says what it runs and why, with links to example repositories, and the members document their options.
 */
export namespace DynamicExecutor {
  /**
   * Function type of a prefixed.
   *
   * @template Arguments Type of parameters
   * @template Ret Type of return value
   * @evidence contracts/common.md#principled-implementation A dynamic function is an asynchronous function of the parameters the executor supplies.
   * @evidence contracts/common.md#clear-and-simple-design A single call signature.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the parameter and return type arguments.
   */
  export interface Closure<Arguments extends any[], Ret = any> {
    (...args: Arguments): Promise<Ret>;
  }

  /**
   * Options for dynamic executor.
   *
   * @evidence contracts/common.md#principled-implementation The fields are what selection and execution need: the prefix, the location, the parameter factory, and optional hooks, concurrency, and extension; `simultaneous` and the extension have documented defaults.
   * @evidence contracts/common.md#clear-and-simple-design A flat option record whose optional members are the extension points (listener, filter, wrapper).
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value is caller-supplied; the defaults are the documented ones (`js`, one at a time).
   * @evidence contracts/common.md#meaningful-documentation Each option documents its meaning, including that the filter receives a file basename and never a function name.
   */
  export interface IProps<Parameters extends any[], Ret = any> {
    /**
     * Prefix of function name.
     *
     * Every prefixed function will be executed.
     *
     * In other words, if a function name doesn't start with the prefix, then it
     * would never be executed. Also, when a file name (basename) does not start
     * with the prefix, the file would never be imported either, so that every
     * function defined in the file would never be executed.
     */
    prefix: string;

    /** Location of the test functions. */
    location: string;

    /**
     * Get parameters of a function.
     *
     * @param name Function name
     * @returns Parameters
     * @evidence contracts/common.md#principled-implementation The function is called with the function name at each execution and returns the argument list, so each test gets fresh parameters keyed by its name.
     * @evidence contracts/common.md#clear-and-simple-design One required callback with one input.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Arguments come only from the caller's function.
     * @evidence contracts/common.md#meaningful-documentation The comment documents the parameter and the return value.
     */
    parameters: (name: string) => Parameters;

    /**
     * On complete function.
     *
     * Listener of completion of a test function.
     *
     * @param exec Execution result of a test function
     * @evidence contracts/common.md#principled-implementation The listener is called from the `finally` of each execution with the execution record, so it observes both success and failure, after the completion time is set.
     * @evidence contracts/common.md#clear-and-simple-design One optional callback with one record argument.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It only observes; the executor does not change behavior based on it.
     * @evidence contracts/common.md#meaningful-documentation The comment states that it listens to the completion of a test function.
     */
    onComplete?: (exec: IExecution) => void;

    /**
     * Filter function whether to run or not.
     *
     * The filter function is called with the file name (basename) of each
     * dynamic function module, not with the function name. When it returns
     * `false`, the file would never be imported, so that every function defined
     * in the file would never be executed either.
     *
     * @param file File name (basename) of the dynamic functions
     * @returns Whether to run or not
     * @evidence contracts/common.md#principled-implementation The predicate is evaluated on the file basename before the file is imported, so a `false` result prevents both the import and the execution of every function in it.
     * @evidence contracts/common.md#clear-and-simple-design One optional predicate over one string.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection follows the caller's predicate, not fixed names.
     * @evidence contracts/common.md#meaningful-documentation The comment states the argument and the effect of a `false` answer.
     */
    filter?: (file: string) => boolean;

    /**
     * Wrapper of test function.
     *
     * If you specify this `wrapper` property, every dynamic functions loaded
     * and called by this `DynamicExecutor` would be wrapped by the `wrapper`
     * function.
     *
     * @param name Function name
     * @param closure Function to be executed
     * @param parameters Parameters, result of options.parameters function.
     * @returns Wrapper function
     * @evidence contracts/common.md#principled-implementation When present, the wrapper is called instead of the function directly with the name, the function, and the parameters, so a caller can add setup, retries, or measurement around each test.
     * @evidence contracts/common.md#clear-and-simple-design One optional callback that replaces the direct call.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The executor calls the wrapper for every function it runs, without a test-specific bypass.
     * @evidence contracts/common.md#meaningful-documentation The comment documents each parameter and the return value.
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
   *
   * @evidence contracts/common.md#principled-implementation The report keeps the location, every execution record in start order, and the elapsed time computed as the difference of two clock reads.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is measured by the executor.
   * @evidence contracts/common.md#meaningful-documentation Each field documents its meaning.
   */
  export interface IReport {
    /** Location path of dynamic functions. */
    location: string;

    /** Execution results of dynamic functions. */
    executions: IExecution[];

    /** Total elapsed time. */
    time: number;
  }

  /**
   * Execution of a test function.
   *
   * @evidence contracts/common.md#principled-implementation An execution records the function name, its file, the returned value, the error or `null`, and the start and completion instants, which is what a listener needs to report a test.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is measured by the executor.
   * @evidence contracts/common.md#meaningful-documentation Each field documents its meaning, and the two time fields state that they hold ISO 8601 strings.
   */
  export interface IExecution {
    /** Name of function. */
    name: string;

    /** Location path of the function. */
    location: string;

    /** Returned value from the function. */
    value: unknown;

    /** Error when occurred. */
    error: Error | null;

    /** Start time, as an ISO 8601 string. */
    started_at: string;

    /** Completion time, as an ISO 8601 string. */
    completed_at: string;
  }

  /**
   * Prepare dynamic executor in strict mode.
   *
   * In strict mode, if any error occurs, the program will be terminated
   * directly. Otherwise, {@link validate} mode does not terminate when error
   * occurs, but just archive the error log.
   *
   * @param props Properties of dynamic execution
   * @returns Report of dynamic test functions execution
   * @evidence contracts/common.md#principled-implementation Strict mode rethrows the first error of a function, which rejects the returned promise and ends the run with that failure, after the execution record and the listener have seen it.
   * @evidence contracts/common.md#clear-and-simple-design A one-line binding of the shared pipeline with the strict flag.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The mode changes only whether a failure is rethrown; nothing is silenced.
   * @evidence contracts/common.md#meaningful-documentation The comment states the strict behavior, contrasts it with `validate`, and documents the parameter and the report.
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
   * @evidence contracts/common.md#principled-implementation Loose mode records the error in the execution and continues with the next function, so the report lists every failure.
   * @evidence contracts/common.md#clear-and-simple-design A one-line binding of the shared pipeline with the loose flag.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The mode changes only whether a failure is rethrown; the error stays in the report.
   * @evidence contracts/common.md#meaningful-documentation The comment states the loose behavior, contrasts it with `assert`, and documents the parameter and the report.
   */
  export const validate = <Arguments extends any[]>(
    props: IProps<Arguments>,
  ): Promise<IReport> => main(false)(props);

  const main =
    (assert: boolean) =>
    async <Arguments extends any[]>(
      props: IProps<Arguments>,
    ): Promise<IReport> => {
      const simultaneous: number = props.simultaneous ?? 1;
      if (!Number.isSafeInteger(simultaneous) || simultaneous <= 0)
        throw new Error(
          "DynamicExecutor: simultaneous must be a positive integer.",
        );
      const report: IReport = {
        location: props.location,
        time: Date.now(),
        executions: [],
      };

      const executor = execute(props)(report)(assert);
      const processes: Array<() => Promise<void>> = await iterate({
        extension: props.extension ?? "js",
        location: props.location,
        prefix: props.prefix,
        filter: props.filter,
        executor,
      });
      await Promise.all(
        new Array(simultaneous).fill(0).map(async () => {
          while (processes.length !== 0) {
            const task = processes.shift();
            await task?.();
          }
        }),
      );
      report.time = Date.now() - report.time;
      return report;
    };

  const specifier = (location: string): string => {
    const absolute: string = NodePath.resolve(location);
    const relative: string = NodePath.relative(__dirname, absolute)
      .split(NodePath.sep)
      .join("/");
    if (relative.length !== 0 && NodePath.isAbsolute(relative) === false)
      return `./${relative}`;
    // No relative expression exists. On Windows `path.relative` cannot express a
    // path between two drive roots and hands back the absolute target, so the
    // "./" prefix used to produce "./C:/..." — neither relative nor absolute —
    // which resolved against this directory and failed with MODULE_NOT_FOUND.
    // Fall back to the spelling the active module system accepts: `require()`,
    // which a CommonJS build downlevels `import()` into, takes a filesystem path
    // and rejects a URL, while a native ESM `import()` takes a URL and rejects a
    // Windows filesystem path.
    return isCommonJS() ? absolute : pathToFileURL(absolute).href;
  };

  const isCommonJS = (): boolean =>
    typeof module === "object" &&
    module !== null &&
    typeof require === "function";

  const iterate = async <Arguments extends any[]>(props: {
    location: string;
    extension: string;
    prefix: string;
    filter?: (file: string) => boolean;
    executor: (path: string, modulo: Module<Arguments>) => Promise<void>;
  }): Promise<Array<() => Promise<void>>> => {
    const container: Array<() => Promise<void>> = [];
    const visitor = async (path: string): Promise<void> => {
      const directory: string[] = await fs.promises.readdir(path);
      for (const file of directory) {
        const location: string = NodePath.resolve(`${path}/${file}`);
        const stats: fs.Stats = await fs.promises.lstat(location);

        if (stats.isDirectory() === true) {
          await visitor(location);
          continue;
        }
        // Compare the whole suffix. A fixed-width slice silently assumed a
        // two-character extension, so every longer one ("mjs", "cjs", "tsx")
        // matched nothing and the run reported success with no test executed.
        else if (file.endsWith(`.${props.extension}`) === false) continue;
        // GATE BY FILE NAME (PREFIX & FILTER), SO THAT EXCLUDED FILES ARE
        // NEVER IMPORTED.
        else if (file.startsWith(props.prefix) === false) continue;
        else if (props.filter && props.filter(file) === false) continue;

        // Convert the absolute path to a POSIX relative specifier. It works
        // both as a native ESM dynamic import (module: nodenext, which keeps
        // `import()` as is) and as a `require()` call (module: commonjs, which
        // downlevels `import()` to `require()`). A raw absolute path would
        // break the native import on Windows (file URL scheme), and a `file://`
        // URL would break the downleveled `require()`.
        const modulo: Module<Arguments> = await import(specifier(location));
        container.push(() => props.executor(location, modulo));
      }
    };
    await visitor(props.location);
    return container;
  };

  const execute =
    <Arguments extends any[]>(props: IProps<Arguments>) =>
    (report: IReport) =>
    (assert: boolean) =>
    async (location: string, modulo: Module<Arguments>): Promise<void> => {
      for (const [key, closure] of Object.entries(modulo)) {
        if (
          key.substring(0, props.prefix.length) !== props.prefix ||
          typeof closure !== "function"
        )
          continue;

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
        };
        report.executions.push(result);

        try {
          result.value = await func();
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
