import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";

const main = async (): Promise<void> => {
  // PREPARE SERVER
  const app = await NestFactory.create(BbsArticleModule, { logger: false });
  await app.listen(3_000);

  const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
    servant: `${__dirname}/servant.ts`,
    count: 10,
    threads: 3,
    simultaneous: 4,
    stdio: "ignore",
  });
  if (report.statistics.count !== 10)
    throw new Error(
      `DynamicBenchmarker executed ${report.statistics.count} requests for a count of 10.`,
    );
  if (report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0) !== 10)
    throw new Error("DynamicBenchmarker endpoint totals do not match count.");
  await app.close();
  await fs.promises.writeFile(
    "BENCHMARK.md",
    DynamicBenchmarker.markdown(report),
    "utf8",
  );
};
main().catch(console.error);
