import { DynamicBenchmarker } from "@nestia/benchmark";

// This process entry is compiled with the one common consumer program.
const host = process.env.NESTIA_BENCHMARK_HOST;
if (host === undefined)
  throw new Error("The shared benchmark host is missing.");
DynamicBenchmarker.servant({
  connection: { host },
  location: __dirname + "/features",
  parameters: (connection) => [connection],
  prefix: "test_api_",
  extension: "js",
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
