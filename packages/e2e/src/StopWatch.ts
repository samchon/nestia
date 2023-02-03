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
    export async function measure(task: Task): Promise<number> {
        const time: number = Date.now();
        await task();
        return Date.now() - time;
    }

    /**
     *
     * @param title
     * @param task
     * @returns
     */
    export async function trace(title: string, task: Task): Promise<number> {
        process.stdout.write(`  - ${title}: `);
        const time: number = await measure(task);

        console.log(`${time.toLocaleString()} ms`);
        return time;
    }
}
