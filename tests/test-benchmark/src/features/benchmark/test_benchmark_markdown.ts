import { DynamicBenchmarker } from "@nestia/benchmark";
import os from "os";
import path from "path";

/**
 * Verifies the benchmark report states only what the benchmark knows, writes
 * its numbers the documented way, and reads the same under any default locale
 * (#1683).
 *
 * The renderer documents `en-US` separators and decimals truncated, not
 * rounded, to two places, an absent figure as `N/A`, endpoints ordered by their
 * mean time and a failures table that lists only endpoints that failed. A
 * rounding or default-locale implementation changes those texts without
 * changing their structure.
 *
 * 1. Render a report with authored absent CPU information, and assert it names no
 *    backend server spec and says the CPU is unknown.
 * 2. Assert the arguments, the elapsed time and the total row carry the literal
 *    `en-US` and truncated figures, and the endpoint table orders the slower
 *    endpoint first with `N/A` for an absent mean.
 * 3. Assert the failures table lists the endpoint that failed and not the one that
 *    did not.
 * 4. Render through the public wrapper and assert actual host facts are displayed.
 *    The same literal formatting oracle also runs under a foreign default
 *    locale.
 *
 * @evidence contracts/testing.md#behavioral-verification It renders a report with `DynamicBenchmarker.markdown()` through the internal pure renderer with an authored absent CPU model, asserts no backend server spec and `CPU: unknown`, asserts the literal figure rows, endpoint order and failures rows, then checks the public wrapper displays the actual CPU, RAM and Node version without replacing foreign methods. Literal numeric rows are independent of the process default locale.
 * @evidence contracts/testing.md#independent-expectations The renderer's documented contract fixes the texts: `en-US` grouping, truncation to two decimals (1,234.567 is 1,234.56, where rounding would give 1,234.57), `N/A` for a null figure, the mean-descending endpoint order, and the failure counts as the difference of count and success; each expectation is a literal derived from the report's input numbers, not output of the renderer recorded as a snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Missing CPU information and a named model are the host-input controls; the public wrapper uses actual Node host facts. A foreign-default-locale run of this same unit is an environment validation control. A truncation that rounds, an endpoint list left in input order, a failures table that lists every endpoint and a null figure printed as a number are the distinct defects, each separated by a figure or row in the same report.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-benchmark` process discovered by `DynamicExecutor`, calling the pure internal renderer and public `@nestia/benchmark` API in-process; no servant process or server is started, which the shared `test-e2e` benchmark batch suite owns.
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
    endpoints: [
      {
        method: "GET",
        path: "/fast",
        count: 6_000,
        success: 6_000,
        mean: 2.999,
        stdev: 0.5,
        minimum: 1,
        maximum: 9,
      },
      {
        method: "POST",
        path: "/slow",
        count: 6_345,
        success: 6_000,
        mean: 2_000.5,
        stdev: null,
        minimum: null,
        maximum: 98_765.4321,
      },
    ],
    started_at: new Date(0).toISOString(),
    completed_at: new Date(1_234_567).toISOString(),
    memories: [],
  };
  const { DynamicBenchmarkReporter } = require(
    path.resolve(
      process.cwd(),
      "../../packages/benchmark/lib/internal/DynamicBenchmarkReporter",
    ),
  ) as typeof import("../../../../../packages/benchmark/lib/internal/DynamicBenchmarkReporter");
  const expect = (markdown: string, line: string): void => {
    if (markdown.split("\n").includes(line) === false)
      throw new Error(`The benchmark report lacks ${JSON.stringify(line)}.`);
  };
  {
    const markdown = DynamicBenchmarkReporter.markdown(report, {
      cpu: undefined,
      memory: 8 * 1024 ** 3,
      node: "v24.0.0",
    });
    if (markdown.includes("Backend Server"))
      throw new Error("The benchmark report states an unmeasured server spec.");
    if (markdown.includes("CPU: unknown") === false)
      throw new Error("The benchmark report hides the missing CPU model.");

    expect(markdown, "    - Count: 12,345");
    expect(markdown, "    - Threads: 4");
    expect(markdown, "    - Simultaneous: 16");
    expect(markdown, "    - Elapsed: 1,234,567 ms");
    expect(
      markdown,
      "Total | 12,345 | 12,000 | 1,234.56 | 12.5 | 1 | 98,765.43",
    );
    expect(markdown, "GET /fast | 6,000 | 6,000 | 2.99 | 0.5 | 1 | 9");
    expect(
      markdown,
      "POST /slow | 6,345 | 6,000 | 2,000.5 | N/A | N/A | 98,765.43",
    );
    const lines: string[] = markdown.split("\n");
    if (
      lines.indexOf(
        "POST /slow | 6,345 | 6,000 | 2,000.5 | N/A | N/A | 98,765.43",
      ) > lines.indexOf("GET /fast | 6,000 | 6,000 | 2.99 | 0.5 | 1 | 9")
    )
      throw new Error("The slower endpoint is not listed first.");
    const failures: string[] = lines.slice(lines.indexOf("## Failures") + 3);
    if (
      JSON.stringify(failures) !==
      JSON.stringify(["POST | /slow | 6,345 | 345"])
    )
      throw new Error(
        `The failures table is ${JSON.stringify(failures)}, not the one failed endpoint.`,
      );

    expect(markdown, "    - RAM: 8 GB");
    expect(markdown, "    - NodeJS Version: v24.0.0");
    const named = DynamicBenchmarkReporter.markdown(report, {
      cpu: "Authored CPU",
      memory: 8 * 1024 ** 3,
      node: "v24.0.0",
    });
    expect(named, "    - CPU: Authored CPU");
    const actual = DynamicBenchmarker.markdown(report);
    expect(actual, `    - CPU: ${os.cpus()[0]?.model ?? "unknown"}`);
    expect(
      actual,
      `    - RAM: ${Math.floor(os.totalmem() / 1024 ** 3).toLocaleString("en-US")} GB`,
    );
    expect(actual, `    - NodeJS Version: ${process.version}`);
  }
};
