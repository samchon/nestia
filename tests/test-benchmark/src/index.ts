import { DynamicBenchmarker } from "@nestia/benchmark";
import { NestFactory } from "@nestjs/core";
import fs from "fs";
import os from "os";

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

  // Fewer simultaneous requests than threads would leave a servant a budget
  // of zero and its share of the count unrun, so it is refused up front.
  const refused: unknown = await DynamicBenchmarker.master({
    servant: `${__dirname}/servant.ts`,
    count: 4,
    threads: 4,
    simultaneous: 2,
  }).then(
    () => null,
    (error) => error,
  );
  if (
    !(refused instanceof Error) ||
    !refused.message.includes(
      "simultaneous (2) must not be less than threads (4)",
    )
  )
    throw new Error(
      `DynamicBenchmarker accepted fewer simultaneous requests than threads: ${String(refused)}`,
    );

  validateMarkdown();
};

/**
 * The report states only what the benchmark knows, renders where the platform
 * exposes no CPU information, and reads the same under any default locale
 * (#1683).
 */
const validateMarkdown = (): void => {
  const report: DynamicBenchmarker.IReport = {
    count: 12_345,
    threads: 4,
    simultaneous: 16,
    statistics: {
      count: 12_345,
      success: 12_000,
      mean: 1_234.567,
      stdev: 12.5,
      minimum: 1,
      maximum: 98_765.4321,
    },
    endpoints: [],
    started_at: new Date(0).toISOString(),
    completed_at: new Date(1_234_567).toISOString(),
    memories: [],
  };
  const cpus = os.cpus;
  const toLocaleString = Number.prototype.toLocaleString;
  try {
    (os as { cpus: () => os.CpuInfo[] }).cpus = () => [];
    const markdown: string = DynamicBenchmarker.markdown(report);
    if (markdown.includes("Backend Server"))
      throw new Error("The benchmark report states an unmeasured server spec.");
    if (markdown.includes("CPU: unknown") === false)
      throw new Error("The benchmark report hides the missing CPU model.");

    // a machine whose default locale writes 12.345 for 12,345
    Number.prototype.toLocaleString = function (
      this: number,
      locales?: string | string[],
      options?: Intl.NumberFormatOptions,
    ): string {
      return toLocaleString.call(this, locales ?? "de-DE", options);
    };
    if (DynamicBenchmarker.markdown(report) !== markdown)
      throw new Error("The benchmark report depends on the default locale.");
  } finally {
    (os as { cpus: () => os.CpuInfo[] }).cpus = cpus;
    Number.prototype.toLocaleString = toLocaleString;
  }
};

main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
