import { DynamicExecutor } from "@nestia/e2e";

/**
 * Executes discovered scaffold units serially and reports their elapsed time.
 *
 * Serial execution keeps the corepack prompt environment flag isolated while
 * its case restores the original value. A rejected unit fails the entry.
 *
 * @evidence contracts/common.md#principled-implementation DynamicExecutor.assert discovers test-prefixed TypeScript exports in features, invokes them with no parameters and propagates a failed assertion to the entry catch handler.
 * @evidence contracts/common.md#clear-and-simple-design One discoverable unit population and a reporting callback own execution; individual cases retain their authored inputs and assertions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The runner executes actual units without retries or simulated success; simultaneous one protects the ambient prompt flag from overlapping units.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies discovery, serial-state ownership and failure propagation; the entry prints individual and aggregate durations.
 * @evidence contracts/portability.md#os-neutral-implementation The feature location derives from the running module directory and is passed to DynamicExecutor's native filesystem discovery. The entry launches no executable or shell command.
 */
export async function main(): Promise<void> {
  const report: DynamicExecutor.IReport = await DynamicExecutor.assert({
    parameters: () => [],
    location: __dirname + "/features",
    prefix: "test",
    onComplete: (exec) => {
      const elapsed: number =
        new Date(exec.completed_at).getTime() -
        new Date(exec.started_at).getTime();
      console.log(` - ${exec.name}: ${elapsed.toLocaleString()} ms`);
    },
    simultaneous: 1,
    extension: "ts",
  });
  console.log(`Elapsed time: ${report.time.toLocaleString()} ms`);
}
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
