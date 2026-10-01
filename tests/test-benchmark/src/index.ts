import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";

const main = async (): Promise<void> => {
  // PREPARE SERVER
  const app = await NestFactory.create(BbsArticleModule, { logger: false });
  // Count the requests the servants have in flight at once. Each one waits a
  // little so the servants' loops overlap.
  let inFlight: number = 0;
  let peak: number = 0;
  app.use((_request: unknown, response: any, next: () => void) => {
    peak = Math.max(peak, ++inFlight);
    response.on("close", () => --inFlight);
    setTimeout(next, 20);
  });
  await app.listen(3_000);
  try {
    const progresses: number[] = [];
    const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
      servant: `${__dirname}/servant.ts`,
      count: 30,
      threads: 3,
      simultaneous: 4,
      stdio: "ignore",
      filter: (file) => file === "test_api_count.ts",
      progress: (current) => progresses.push(current),
    });
    if (report.statistics.count !== 30)
      throw new Error(
        `DynamicBenchmarker executed ${report.statistics.count} requests for a count of 30.`,
      );
    if (
      report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !== 30
    )
      throw new Error("DynamicBenchmarker endpoint totals do not match count.");
    // the filter keeps the servants to `test_api_count.ts`: the create
    // feature beside it is a POST, and the count one a PATCH, the only method
    // an endpoint of the report may have
    if (report.endpoints.some((endpoint) => endpoint.method !== "PATCH"))
      throw new Error(
        `DynamicBenchmarker ran a feature its filter excludes: ${JSON.stringify(report.endpoints)}`,
      );
    if (
      progresses.some((current) => current > 30) ||
      progresses[progresses.length - 1] !== 30
    )
      throw new Error(
        "DynamicBenchmarker progress exceeds the requested count.",
      );
    // The servants' budgets sum to `simultaneous`: rounding each servant's
    // share up ran 2 + 2 + 2 requests at once for a configured 4 (#1682).
    if (peak > 4)
      throw new Error(
        `DynamicBenchmarker ran ${peak} requests at once for simultaneous 4.`,
      );
    await fs.promises.writeFile(
      "BENCHMARK.md",
      DynamicBenchmarker.markdown(report),
      "utf8",
    );
  } finally {
    await app.close();
  }
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
