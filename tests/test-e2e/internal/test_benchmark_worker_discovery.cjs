const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const cp = require("node:child_process");

/**
 * Verifies worker discovery imports direct and linked locations exactly once.
 *
 * Relative worker cwd and linked-only imports require real process discovery;
 * wrong-extension files throw if the discovery gate incorrectly imports them.
 *
 * 1. Author one event feature, two aliases and an ancestor cycle.
 * 2. Execute direct and linked roots with relative and absolute locations.
 * 3. Require singleton discovery, two successes and the authored GET endpoint.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed servants discover and import the authored module over real RPC; filter callback identities prove one discovery despite aliases, and report counts plus GET /events prove execution. Wrong-extension code throws if imported.
 * @evidence contracts/testing.md#independent-expectations One authored physical feature prescribes one discovery callback and GET /events; count two prescribes two successful logged events independently of randomized scheduling.
 * @evidence contracts/testing.md#distinguishing-cases Direct relative/absolute and linked-only relative/absolute states retain import controls; two aliases and an ancestor cycle distinguish duplicate or nonterminating traversal, while the throwing txt file rejects extension overmatching.
 * @evidence contracts/testing.md#execution-ownership The sole integrated benchmark batch invokes actual installed master/servant workers. Filesystem/import/RPC boundaries remain integration even without HTTP.
 * @evidence contracts/e2e.md#necessary-boundary Worker cwd, Node module imports and RPC discovery/event delivery cannot be proved by pure path calculations.
 * @evidence contracts/e2e.md#shared-execution All four location states share the installation and authored worker/event script; fresh worker lifetimes are necessary because each location is a conflicting discovery input and must reset imported module state. No compile or backend is added.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The unique sandbox owns directories and links; each master completes before the inherited worker location changes. Finally restores the caller environment; outer teardown removes paths after all workers settle.
 * @evidence contracts/e2e.md#preserved-coverage Relative/absolute imports, two successes, GET endpoint, linked-only roots, alias suppression, ancestor-cycle termination and wrong-extension rejection retain exact original assertions.
 */
const test_benchmark_worker_discovery = async ({ sandbox, installation }) => {
  const library = require.resolve("@nestia/benchmark", { paths: [installation.directory] });
  const { DynamicBenchmarker } = require(library);
  const directory = path.join(sandbox, "benchmark-location");
  const features = path.join(directory, "features");
  const linked = path.join(directory, "linked-features");
  const external = path.join(directory, "external");
  for (const item of [features, linked, external]) fs.mkdirSync(item, { recursive: true });
  const event = `exports.test_event=async(connection)=>{
    const now=new Date();await connection.logger({
      route:{method:"GET",path:"/events",template:null},path:"/events",status:200,
      input:undefined,output:undefined,started_at:now,respond_at:now,completed_at:now,
    });
  };`;
  fs.writeFileSync(path.join(features, "test_event.js"), event);
  fs.writeFileSync(path.join(external, "test_event.js"), event);
  fs.writeFileSync(path.join(external, "test_wrong.txt"), 'throw new Error("Wrong extension must not be imported");');
  const linkType = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(external, path.join(linked, "first"), linkType);
  fs.symlinkSync(external, path.join(linked, "second"), linkType);
  fs.symlinkSync(linked, path.join(external, "ancestor"), linkType);
  const servant = path.join(directory, "servant.cjs");
  fs.writeFileSync(servant, `const {DynamicBenchmarker}=require(${JSON.stringify(library)});
DynamicBenchmarker.servant({connection:{host:"http://localhost:1"},
location:process.env.NESTIA_BENCHMARK_LOCATION,prefix:"test",extension:"js",
parameters:connection=>[connection]}).catch(error=>{console.error(error);process.exitCode=1;});`);
  const previous = process.env.NESTIA_BENCHMARK_LOCATION;
  const failures = [];
  try {
    for (const [title, location] of [
      ["relative", path.relative(process.cwd(), features)], ["absolute", features],
      ["linked relative", path.relative(process.cwd(), linked)], ["linked absolute", linked],
    ]) {
      process.env.NESTIA_BENCHMARK_LOCATION = location;
      try {
        const discovered = [];
        const report = await DynamicBenchmarker.master({
          count: 2, threads: 1, simultaneous: 1, servant, stdio: "ignore",
          filter: (file) => { discovered.push(file); return true; },
        });
        assert.deepEqual(discovered, ["test_event.js"], title + " discovery");
        assert.deepEqual([report.statistics.count, report.statistics.success], [2, 2], title + " statistics");
        assert.deepEqual(report.endpoints.map((endpoint) => [endpoint.method, endpoint.path, endpoint.count]), [["GET", "/events", 2]], title + " endpoints");
        console.log(` - benchmark ${title} discovery: passed`);
      } catch (error) { console.error(error); failures.push(title); }
    }
  } finally {
    if (previous === undefined) delete process.env.NESTIA_BENCHMARK_LOCATION;
    else process.env.NESTIA_BENCHMARK_LOCATION = previous;
  }
  if (failures.length) throw new Error("Benchmark discovery failures: " + failures.join(", "));
};

module.exports = { test_benchmark_worker_discovery };
