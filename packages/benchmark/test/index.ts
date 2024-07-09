import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";

const main = async (): Promise<void> => {
  // PREPARE SERVER
  const app = await NestFactory.create(BbsArticleModule, { logger: false });
  await app.listen(3_000);

  const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
    servant: `${__dirname}/servant.js`,
    count: 1024,
    threads: 4,
    simultaneous: 32,
    stdio: "ignore",
  });
  await app.close();
  await fs.promises.writeFile(
    "BENCHMARK.md",
    DynamicBenchmarker.markdown(report),
    "utf8",
  );
};
main().catch(console.error);
