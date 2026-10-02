import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";
import { runBenchmarkUnits } from "./unit";

const main = async (): Promise<void> => {
  await runBenchmarkUnits();
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
    const multipleProgresses: number[] = [];
    const multiple = await DynamicBenchmarker.master({
      servant: `${__dirname}/servant.ts`,
      count: 6,
      threads: 2,
      simultaneous: 2,
      stdio: "ignore",
      filter: (file) => file === "test_api_multiple_events.ts",
      progress: (current) => multipleProgresses.push(current),
    });
    if (
      multiple.statistics.count !== 12 ||
      multiple.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !==
        12
    )
      throw new Error(
        "Two requests per invocation must produce twelve events.",
      );
    if (
      multipleProgresses.some(
        (current, index) =>
          current > 6 ||
          (index !== 0 && current < multipleProgresses[index - 1]!),
      ) ||
      multipleProgresses.at(-1) !== 6
    )
      throw new Error(
        "Progress must count invocations, independently of event count.",
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
