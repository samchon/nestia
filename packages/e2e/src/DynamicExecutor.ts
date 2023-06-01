import chalk from "chalk";
import fs from "fs";
import NodePath from "path";

import { StopWatch } from "./StopWatch";

/**
 * Dynamic Executor running prefixed functions.
 *
 * `DynamicExecutor` runs every prefixed functions in a specific directory.
 * However, if you want to run only specific functions, you can use
 * `--include` or `--exclude` option in the CLI (Command Line Interface) level.
 *
 * When you want to see example utilization cases, see the below example links.
 *
 * @example https://github.com/samchon/nestia-template/blob/master/src/test/index.ts
 * @example https://github.com/samchon/backend/blob/master/src/test/index.ts
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
    export interface IOptions<Parameters extends any[], Ret = any> {
        /**
         * Prefix of function name.
         *
         * Every prefixed function will be executed.
         *
         * In other words, if a function name doesn't start with the prefix, then it would never be executed.
         */
        prefix: string;

        /**
         * Get parameters of a function.
         *
         * @param name Function name
         * @returns Parameters
         */
        parameters: (name: string) => Parameters;

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
         * @returns Wrapper function
         */
        wrapper?: (
            name: string,
            closure: Closure<Parameters, Ret>,
        ) => Promise<any>;

        /**
         * Whether to show elapsed time on `console` or not.
         *
         * @default true
         */
        showElapsedTime?: boolean;

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
        executions: IReport.IExecution[];

        /**
         * Total elapsed time.
         */
        time: number;
    }
    export namespace IReport {
        /**
         * Execution result of a dynamic function.
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
             * Error when occured.
             */
            error: Error | null;

            /**
             * Elapsed time.
             */
            time: number;
        }
    }

    /**
     * Prepare dynamic executor in strict mode.
     *
     * In strict mode, if any error occurs, the program will be terminated directly.
     * Otherwise, {@link validate} mode does not terminate when error occurs, but
     * just archive the error log.
     *
     * @param options Options of dynamic executor
     * @returns Runner of dynamic functions with specific location
     */
    export const assert =
        <Arguments extends any[]>(options: IOptions<Arguments>) =>
        /**
         * Run dynamic executor.
         *
         * @param path Location of prefixed functions
         */
        (path: string): Promise<IReport> =>
            main(options)(true)(path);

    /**
     * Prepare dynamic executor in loose mode.
     *
     * In loose mode, the program would not be terminated even when error occurs.
     * Instead, the error would be archived and returns as a list. Otherwise,
     * {@link assert} mode terminates the program directly when error occurs.
     *
     * @param options Options of dynamic executor
     * @returns Runner of dynamic functions with specific location
     */
    export const validate =
        <Arguments extends any[]>(options: IOptions<Arguments>) =>
        /**
         * Run dynamic executor.
         *
         * @param path Location of prefix functions
         * @returns List of errors
         */
        (path: string): Promise<IReport> =>
            main(options)(false)(path);

    const main =
        <Arguments extends any[]>(options: IOptions<Arguments>) =>
        (assert: boolean) =>
        async (path: string) => {
            const report: IReport = {
                location: path,
                time: Date.now(),
                executions: [],
            };

            const executor = execute(options)(report)(assert);
            const iterator = iterate(options.extension ?? "js")(executor);
            await iterator(path);

            report.time = Date.now() - report.time;
            return report;
        };

    const iterate =
        (extension: string) =>
        <Arguments extends any[]>(
            executor: (
                path: string,
                modulo: Module<Arguments>,
            ) => Promise<void>,
        ) => {
            const visitor = async (path: string): Promise<void> => {
                const directory: string[] = await fs.promises.readdir(path);
                for (const file of directory) {
                    const location: string = NodePath.resolve(
                        `${path}/${file}`,
                    );
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
        <Arguments extends any[]>(options: IOptions<Arguments>) =>
        (report: IReport) =>
        (assert: boolean) =>
        async (location: string, modulo: Module<Arguments>): Promise<void> => {
            for (const [key, closure] of Object.entries(modulo)) {
                if (
                    key.substring(0, options.prefix.length) !==
                        options.prefix ||
                    typeof closure !== "function" ||
                    (options.filter && options.filter(key) === false)
                )
                    continue;

                const func = async () => {
                    if (options.wrapper !== undefined)
                        await options.wrapper(key, closure);
                    else await closure(...options.parameters(key));
                };
                const label: string = chalk.greenBright(key);

                const result: IReport.IExecution = {
                    name: key,
                    location,
                    error: null,
                    time: Date.now(),
                };
                report.executions.push(result);

                try {
                    if (options.showElapsedTime === false) {
                        await func();
                        result.time = Date.now() - result.time;
                        console.log(`  - ${label}`);
                    } else {
                        result.time = await StopWatch.measure(func);
                        console.log(
                            `  - ${label}: ${chalk.yellowBright(
                                result.time.toLocaleString(),
                            )} ms`,
                        );
                    }
                } catch (exp) {
                    result.time = Date.now() - result.time;
                    result.error = exp as Error;

                    console.log(
                        `  - ${label} -> ${chalk.redBright(
                            (exp as Error)?.name,
                        )}`,
                    );
                    if (assert === true) throw exp;
                }
            }
        };

    interface Module<Arguments extends any[]> {
        [key: string]: Closure<Arguments>;
    }
}
