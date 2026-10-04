import { DynamicBenchmarker } from "@nestia/benchmark";

/**
 * Starts a compiled worker against the shared HTTP application.
 *
 * The master supplies its address before worker creation. Discovery admits
 * compiled workload functions, so workers prepare no TypeScript or native
 * host.
 *
 * @evidence contracts/common.md#principled-implementation The public servant uses the supplied connection and discovers compiled workload exports; an absent host rejects before connecting to an unrelated server.
 * @evidence contracts/common.md#clear-and-simple-design One entry configures one workload directory and derives its extension from the executing file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The installed public worker protocol and generated clients execute unchanged, with an explicit caller-owned host input.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies host ownership, compiled discovery and absence of per-worker language preparation.
 */
export async function startBenchmarkServant(): Promise<void> {
  const host = process.env.TEST_BENCHMARK_HOST;
  if (!host) throw new Error("The shared benchmark host was not supplied.");
  await DynamicBenchmarker.servant({
    connection: { host },
    location: `${__dirname}/features`,
    parameters: (connection) => [connection],
    prefix: "test_api_",
    extension: __filename.substring(__filename.lastIndexOf(".") + 1),
  });
}

startBenchmarkServant().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
