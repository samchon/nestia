/**
 * Elapsed time measurement utility.
 *
 * @author Sachon
 */
export namespace StopWatch {
    /**
     * Type of task.
     */
    export type Task = () => Promise<void>;

    /**
     *
     * @param task
     * @returns
     */
    export const measure = async (task: Task): Promise<number> => {
        const time: number = Date.now();
        await task();
        return Date.now() - time;
    };

    /**
     *
     * @param title
     * @param task
     * @returns
     */
    export const trace =
        (title: string) =>
        async (task: Task): Promise<number> => {
            process.stdout.write(`  - ${title}: `);
            const time: number = await measure(task);

            console.log(`${time.toLocaleString()} ms`);
            return time;
        };
}
