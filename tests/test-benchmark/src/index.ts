import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";

const main = async (): Promise<void> => {
  // PREPARE SERVER
  const app = await NestFactory.create(BbsArticleModule, { logger: false });
  await app.listen(3_000);
  try {
    const progresses: number[] = [];
    const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
      servant: `${__dirname}/servant.ts`,
      count: 10,
      threads: 3,
      simultaneous: 4,
      stdio: "ignore",
      filter: (file) => file === "test_api_count.ts",
      progress: (current) => progresses.push(current),
    });
    if (report.statistics.count !== 10)
      throw new Error(
        `DynamicBenchmarker executed ${report.statistics.count} requests for a count of 10.`,
      );
    if (
      report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !== 10
    )
      throw new Error("DynamicBenchmarker endpoint totals do not match count.");
    if (
      progresses.some((current) => current > 10) ||
      progresses[progresses.length - 1] !== 10
    )
      throw new Error("DynamicBenchmarker progress exceeds the requested count.");
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
