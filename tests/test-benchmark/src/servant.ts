import { DynamicBenchmarker } from "@nestia/benchmark";

DynamicBenchmarker.servant({
  connection: {
    host: `http://127.0.0.1:3000`,
  },
  location: `${__dirname}/features`,
  parameters: (connection) => [connection],
  prefix: "test_api_",
  // Feature files are executed from TypeScript source under ttsx.
  extension: "ts",
}).catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
