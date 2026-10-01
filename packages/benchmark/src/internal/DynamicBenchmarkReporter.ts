import { DynamicBenchmarker } from "../DynamicBenchmarker";

/**
 * Renders a benchmark report as markdown.
 *
 * @evidence contracts/common.md#principled-implementation The reporter formats one report into fixed sections (specifications, arguments, time, statistics, memory chart, endpoints, failures) using a fixed locale.
 * @evidence contracts/common.md#clear-and-simple-design A one-function namespace, internal to the package, that keeps presentation out of the benchmark logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The content is computed from the report and host facts; no numbers are hardcoded.
 * @evidence contracts/common.md#meaningful-documentation The comment states its single job.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The namespace organizes rendering declarations; it performs no native filesystem, process or host observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace only groups declarations; the markdown operation owns its traversal and formatting algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration coordinates no shared computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace owns no retained state or handles.
 */
export namespace DynamicBenchmarkReporter {
  /**
   * Host facts captured by the caller when a report is rendered.
   *
   * An absent CPU model means the platform exposed no CPU information. Memory
   * remains in bytes until rendering, and the Node version is displayed
   * verbatim.
   *
   * @evidence contracts/common.md#principled-implementation CPU absence, memory bytes and the runtime version represent the three facts displayed by the renderer without depending on a platform-specific provider.
   * @evidence contracts/common.md#clear-and-simple-design One record separates host observation from report formatting; each member supplies one displayed fact.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record describes native facts supplied by the actual public caller and introduces no fixture-specific behavior.
   * @evidence contracts/common.md#meaningful-documentation Member comments explain absence, units and display semantics.
   * @evidence contracts/portability.md#os-neutral-implementation Missing CPU data is represented explicitly rather than inferred from an operating-system name; memory and version retain Node's native units and spelling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record describes supplied facts and chooses no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A host-fact record coordinates no computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record owns no handles, tasks or retention policy.
   */
  export interface IHost {
    /** First CPU model, or undefined when the platform reports no CPU. */
    cpu: string | undefined;

    /** Total host memory in bytes. */
    memory: number;

    /** Node runtime version as reported by process.version. */
    node: string;
  }
  /**
   * Renders the report as markdown.
   *
   * Numbers use the fixed `en-US` locale, so a report reads the same on every
   * machine. Decimals are truncated, not rounded, to two places. The CPU model
   * is `unknown` when the platform exposes no CPU information.
   *
   * @evidence contracts/common.md#principled-implementation Each table row is built from the same statistics record; `Math.floor` on the value scaled by 100 truncates to two decimals and `en-US` fixes separators, so output does not depend on the default locale; a missing CPU model degrades to a stated `unknown`.
   * @evidence contracts/common.md#clear-and-simple-design Small local helpers (`integer`, `format`, `row`, `line`) share the formatting rules inside one function, so one place decides how a number reads.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The report states only the report's measurements and supplied host facts; nothing describes an unmeasured backend server or changes foreign runtime methods.
   * @evidence contracts/common.md#meaningful-documentation The comment states the locale, the truncation, and the CPU fallback.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The renderer consumes supplied CPU, memory and runtime facts and fixes numeric output to en-US; no native platform boundary is accessed by this operation.
   * @evidence contracts/performance.md#efficient-algorithms Endpoint and failure ordering require comparison sorts, costing O(E log E); four memory series each scan M samples, and temporary rows and final text scale with displayed data. Sorting copies preserve the caller's endpoint order.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call renders its supplied report and host snapshot; it coordinates no completed or in-flight computation across callers.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Rendering retains only invocation-local arrays and strings until return and owns no cache, handle or background task.
   */
  export const markdown = (
    report: DynamicBenchmarker.IReport,
    host: IHost,
  ): string => {
    // one fixed locale, so a report reads the same on every machine
    const integer = (value: number): string => value.toLocaleString("en-US");
    const format = (value: number | null) =>
      value === null
        ? "N/A"
        : (Math.floor(value * 100) / 100).toLocaleString("en-US");
    const head = () =>
      [
        "Type",
        "Count",
        "Success",
        "Mean.",
        "Stdev.",
        "Minimum",
        "Maximum",
      ].join(" | ") +
      "\n" +
      new Array(7).fill("----").join("|");
    const row = (title: string, s: DynamicBenchmarker.IReport.IStatistics) =>
      [
        title,
        integer(s.count),
        integer(s.success),
        format(s.mean),
        format(s.stdev),
        format(s.minimum),
        format(s.maximum),
      ].join(" | ");
    const line = (
      title: string,
      getter: (m: NodeJS.MemoryUsage) => number,
    ): string =>
      `line "${title}" [${report.memories.map((m) => Math.floor(getter(m.usage) / 1024 ** 2)).join(", ")}]`;

    return [
      `# Benchmark Report`,
      "> Generated by [`@nestia/benchmark`](https://github.com/samchon/nestia)",
      ``,
      `  - Specifications`,
      `    - CPU: ${host.cpu ?? "unknown"}`,
      `    - RAM: ${integer(Math.floor(host.memory / 1024 / 1024 / 1024))} GB`,
      `    - NodeJS Version: ${host.node}`,
      `  - Arguments`,
      `    - Count: ${integer(report.count)}`,
      `    - Threads: ${integer(report.threads)}`,
      `    - Simultaneous: ${integer(report.simultaneous)}`,
      `  - Time`,
      `    - Start: ${report.started_at}`,
      `    - Complete: ${report.completed_at}`,
      `    - Elapsed: ${integer(new Date(report.completed_at).getTime() - new Date(report.started_at).getTime())} ms`,
      ``,
      head(),
      row("Total", report.statistics),
      "",
      "> Unit: milliseconds",
      "",
      "## Memory Consumptions",
      "```mermaid",
      "xychart-beta",
      `  x-axis "Time (second)"`,
      `  y-axis "Memory (MB)"`,
      `  ${line("Resident Set Size", (m) => m.rss)}`,
      `  ${line("Heap Total", (m) => m.heapTotal)}`,
      `  ${line("Heap Used + External", (m) => m.heapUsed + m.external)}`,
      `  ${line("Heap Used Only", (m) => m.heapUsed)}`,
      "```",
      "",
      `> - 🟦 Resident Set Size`,
      `> - 🟢 Heap Total`,
      `> - 🔴 Heap Used + External`,
      `> - 🟡 Heap Used Only`,
      "",
      "## Endpoints",
      head(),
      ...report.endpoints
        .slice()
        .sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))
        .map((endpoint) =>
          row(`${endpoint.method} ${endpoint.path}`, endpoint),
        ),
      "",
      "> Unit: milliseconds",
      "",
      "## Failures",
      "Method | Path | Count | Failures",
      "-------|------|-------|----------",
      ...report.endpoints
        .filter((e) => e.success !== e.count)
        .slice()
        .sort((a, b) => b.count - a.count)
        .map((e) =>
          [
            e.method,
            e.path,
            integer(e.count),
            integer(e.count - e.success),
          ].join(" | "),
        ),
    ].join("\n");
  };
}
