import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

/**
 * Verifies the benchmark servant loads feature files from a location given
 * relative to the working directory and follows directory links exactly once.
 *
 * The servant listed the directory against the working directory but imported
 * each file with the unresolved path, which Node resolves against the library's
 * own folder, so a relative location found its files and then failed to load
 * them.
 *
 * 1. Write a servant program and one feature file under a temporary folder of the
 *    working directory, the feature logging one event without any network.
 * 2. Run the master over the real child process with a relative servant location
 *    and, as the control, an absolute one. Repeat with a linked-only target,
 *    two directory aliases and a link back to the traversal's ancestor.
 * 3. Assert every run discovers one feature, executes it twice and reports its
 *    endpoint; a mismatching extension must never be imported.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual master spawns a servant that discovers and imports the authored feature; exact filter callback identities prove one discovery despite aliases, while report counts and endpoint values prove successful feature execution. The wrong-extension fixture throws if loaded.
 * @evidence contracts/testing.md#independent-expectations One authored accepted file prescribes one filter callback; the supplied request budget prescribes two successful events, and the handwritten feature prescribes GET /events. Discovery counts are observed independently of randomized scheduling rather than inferred from request totals.
 * @evidence contracts/testing.md#distinguishing-cases Direct relative and absolute locations retain the original controls. Linked-only relative and absolute locations add two aliases of one external target and an ancestor cycle; each must discover only that one physical directory. A wrong-extension throwing file is the negative naming control.
 * @evidence contracts/testing.md#execution-ownership E2E: DynamicExecutor discovers this matching test-boundaries export, which invokes the built public master and real servant workers. No network is used, but actual process and discovery connections establish its boundary classification; the fixture and inherited environment value are restored in finally.
 * @evidence contracts/e2e.md#necessary-boundary Real master/servant RPC, worker cwd, filesystem discovery and Node imports must connect for a relative or linked location to produce events. In-process resolver calculations cannot prove the worker imports the located feature or delivers discovery filters and logged events back to its master.
 * @evidence contracts/e2e.md#shared-execution All four path states share one authored feature body, servant entry, caller-built package artifacts and temporary fixture. Each master opens one worker because the relative/absolute and direct/linked location is a distinct worker environment input; no package installation, native compilation or application host is prepared.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each master resets its filter observations and worker module state, closes its workers before returning, and receives only its selected location. Both aliases and the ancestor link are confined to the owned fixture. Finally restores the preceding BENCHMARK_LOCATION value and removes the fixture after awaited masters settle.
 * @evidence contracts/e2e.md#preserved-coverage Original relative/absolute imports, two successful events and GET /events aggregation remain. Linked-only discovery, duplicate-directory suppression, ancestor-cycle termination and rejected extension controls add coverage without replacing worker execution with fixture-arrangement checks.
 */
export async function test_benchmark_servant_relative_location(): Promise<void> {
  const root: string = path.resolve(process.cwd(), "..", "..");
  const library: string = path
    .join(root, "packages", "benchmark", "lib", "index.js")
    .split("\\")
    .join("/");
  const directory: string = fs.mkdtempSync(
    path.join(process.cwd(), ".benchmark-location-"),
  );
  const previousLocation: string | undefined = process.env.BENCHMARK_LOCATION;
  try {
    fs.mkdirSync(path.join(directory, "features"));
    fs.writeFileSync(
      path.join(directory, "features", "test_event.js"),
      `exports.test_event = async (connection) => {
  const now = new Date();
  await connection.logger({
    route: { method: "GET", path: "/events", template: null },
    path: "/events",
    status: 200,
    input: undefined,
    output: undefined,
    started_at: now,
    respond_at: now,
    completed_at: now,
  });
};\n`,
      "utf8",
    );
    const linked: string = path.join(directory, "linked-features");
    const external: string = path.join(directory, "external");
    fs.mkdirSync(linked);
    fs.mkdirSync(external);
    fs.copyFileSync(
      path.join(directory, "features", "test_event.js"),
      path.join(external, "test_event.js"),
    );
    fs.writeFileSync(
      path.join(external, "test_wrong.txt"),
      'throw new Error("Wrong extension must not be imported");',
    );
    fs.symlinkSync(external, path.join(linked, "first"), "junction");
    fs.symlinkSync(external, path.join(linked, "second"), "junction");
    fs.symlinkSync(linked, path.join(external, "ancestor"), "junction");
    const servant: string = path.join(directory, "servant.js");
    fs.writeFileSync(
      servant,
      `const { DynamicBenchmarker } = require(${JSON.stringify(library)});
DynamicBenchmarker.servant({
  connection: { host: "http://localhost:1" },
  location: process.env.BENCHMARK_LOCATION,
  prefix: "test",
  extension: "js",
  parameters: (connection) => [connection],
});\n`,
      "utf8",
    );
    const { DynamicBenchmarker } = require(library) as {
      DynamicBenchmarker: {
        master: (props: object) => Promise<{
          statistics: { count: number; success: number };
          endpoints: Array<{ method: string; path: string; count: number }>;
        }>;
      };
    };
    const features: string = path.join(directory, "features");
    for (const [title, location] of [
      ["relative", path.relative(process.cwd(), features)],
      ["absolute", features],
      ["linked relative", path.relative(process.cwd(), linked)],
      ["linked absolute", linked],
    ] as const) {
      process.env.BENCHMARK_LOCATION = location;
      const discovered: string[] = [];
      const report = await DynamicBenchmarker.master({
        count: 2,
        threads: 1,
        simultaneous: 1,
        servant,
        stdio: "ignore",
        filter: (file: string) => {
          discovered.push(file);
          return true;
        },
      });
      TestValidator.equals(`${title} discovery`, discovered, ["test_event.js"]);
      TestValidator.equals(
        `${title} statistics`,
        [report.statistics.count, report.statistics.success],
        [2, 2],
      );
      TestValidator.equals(
        `${title} endpoints`,
        report.endpoints.map((e) => [e.method, e.path, e.count]),
        [["GET", "/events", 2]],
      );
    }
  } finally {
    if (previousLocation === undefined) delete process.env.BENCHMARK_LOCATION;
    else process.env.BENCHMARK_LOCATION = previousLocation;
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
