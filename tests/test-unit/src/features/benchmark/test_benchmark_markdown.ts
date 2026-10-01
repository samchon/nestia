import { DynamicBenchmarker } from "@nestia/benchmark";
import os from "os";

/**
 * Verifies the benchmark report states only what the benchmark knows, renders
 * where the platform exposes no CPU information, and reads the same under any
 * default locale (#1683).
 *
 * 1. Render a report on a platform whose `os.cpus()` is empty, and assert it names
 *    no backend server spec and says the CPU is unknown.
 * 2. Render it again under a default locale that writes `12.345` for `12,345`, and
 *    assert the text is unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification It renders a report with `DynamicBenchmarker.markdown()` while `os.cpus()` is stubbed to an empty list, asserts no backend server spec and `CPU: unknown`, then renders it again under a default locale that writes `12.345` for `12,345` and asserts identical text.
 * @evidence contracts/testing.md#independent-expectations The report may state only what was measured and must read the same everywhere; the expected phrases and the equality between two renderings are the contract, not output of the renderer recorded as a snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Missing CPU information and a foreign default locale are the two environmental differences; the same report is the control in both.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, calling the public `@nestia/benchmark` API in-process; no servant process or server is started, which the E2E `test-benchmark` suite owns.
 */
export const test_benchmark_markdown = (): void => {
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
