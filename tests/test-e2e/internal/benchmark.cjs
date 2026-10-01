const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const cp = require("node:child_process");

/**
 * Verifies worker budgets, filtered imports and HTTP aggregation in one run.
 *
 * Server response-close observations provide a concurrency oracle separate
 * from the master's returned events. Three workers divide four request slots.
 *
 * 1. Reset the common backend's scoped benchmark observation.
 * 2. Execute thirty generated PATCH calls over three real servants.
 * 3. Assert report, progress, filter, success and independently observed limits.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual installed DynamicBenchmarker master/servant RPC and generated HTTP calls must produce exactly thirty successful events, PATCH-only endpoint totals, bounded final progress and at most four independently observed requests in flight.
 * @evidence contracts/testing.md#independent-expectations Thirty and four are caller budgets; the stateless controller returns one. Response-close middleware observes actual server work independently of benchmark aggregation.
 * @evidence contracts/testing.md#distinguishing-cases Non-divisible four-over-three budgets expose rounded-up allocations. A rejected throwing module exposes filter-before-import defects; positive successful requests distinguish mere failure-event counts.
 * @evidence contracts/testing.md#execution-ownership The sole installed E2E entry invokes this export after consumer compilation while its common backend remains open. This is real worker and HTTP integration.
 * @evidence contracts/e2e.md#necessary-boundary Generated request logging, worker RPC, budget fan-out and server concurrency cannot be proved through isolated statistics calculations.
 * @evidence contracts/e2e.md#shared-execution One master run shares the existing installation, producer, generated consumer and backend. Its three real servants are required to distinguish non-divisible allocations.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The monitor resets only without outstanding benchmark responses; the route is stateless. The worker host environment is restored in finally, and master owns servant closure before backend teardown.
 * @evidence contracts/e2e.md#preserved-coverage Original count, endpoint totals, PATCH filter, final/bounded progress and response-close peak assertions remain; the import-negative and successful-event assertions strengthen their controls. Original files remain until the executable transfer gate succeeds.
 */
const runHttp = async ({ sandbox, host, installation }) => {
  const { DynamicBenchmarker } = require(require.resolve("@nestia/benchmark", {
    paths: [installation.directory],
  }));
  const monitor = require(path.join(sandbox, ".producer/benchmark/BenchmarkMonitor.js"));
  monitor.resetBenchmarkMonitor();
  const previous = process.env.NESTIA_BENCHMARK_HOST;
  process.env.NESTIA_BENCHMARK_HOST = host;
  try {
    const progress = [];
    const report = await DynamicBenchmarker.master({
      servant: path.join(sandbox, ".consumer/benchmark/servant.js"),
      count: 30,
      threads: 3,
      simultaneous: 4,
      stdio: "ignore",
      filter: (file) => file === "test_api_count.js",
      progress: (count) => progress.push(count),
    });
    assert.equal(report.statistics.count, 30);
    assert.equal(report.statistics.success, 30);
    assert.equal(report.endpoints.reduce((sum, endpoint) => sum + endpoint.count, 0), 30);
    assert.ok(report.endpoints.every((endpoint) => endpoint.method === "PATCH"));
    assert.ok(progress.every((count) => count <= 30));
    assert.equal(progress.at(-1), 30);
    const observed = monitor.readBenchmarkMonitor();
    assert.equal(observed.requests, 30);
    assert.ok(observed.peak > 0 && observed.peak <= 4, JSON.stringify(observed));
    console.log(" - benchmark HTTP budget/filter/progress: passed");
  } finally {
    if (previous === undefined) delete process.env.NESTIA_BENCHMARK_HOST;
    else process.env.NESTIA_BENCHMARK_HOST = previous;
  }
};

/**
 * Verifies sampler completion, RPC cleanup and actual dropped-report collection.
 *
 * One GC-enabled child supplies both natural-exit and reachability observations;
 * the caller-owned unresolved getter remains rooted until collection completes.
 *
 * 1. Reuse one inert RPC worker script for normal, rejected and gated executions.
 * 2. Check active, rejected, pending and late-result memory observations.
 * 3. Drop pending and settled reports and require independent sentinel collection.
 * 4. Require the child to exit naturally without an explicit process exit.
 *
 * @evidence contracts/testing.md#behavioral-verification Installed master executions retain active samples, ignore getter rejection, preserve original RPC failure and reject mutation by a late result; exposed-GC observes released report arrays while a getter remains rooted, and natural exit detects leaked workers or timers.
 * @evidence contracts/testing.md#independent-expectations Literal RPC error and caller usage values establish exact observations; completed reports cannot acquire later samples. Independent WeakRef sentinel collection validates GC opportunity separately from the report array.
 * @evidence contracts/testing.md#distinguishing-cases Two-servant success/rejection and active/rejected/pending getter modes retain the original lifecycle controls; single-servant pending/settled GC modes retain exact getter and sample counts.
 * @evidence contracts/testing.md#execution-ownership The sole integrated E2E benchmark batch invokes one ordinary Node child with --expose-gc and installed packed benchmark/TGrid modules. No consumer installation or product compilation is repeated.
 * @evidence contracts/e2e.md#necessary-boundary Real RPC failures, process handle release and asynchronous V8 reachability cannot be established by mocking workers or inspecting sampler fields.
 * @evidence contracts/e2e.md#shared-execution Both former child realms share one GC-enabled child and one inert worker script. Seven master lifetimes remain because release after each conflicting success/failure/getter state is the tested transition, including the separate pending report that stays observable for late-result comparison.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each master resets its gate, getter and inherited worker mode. Finally resolves caller-held promises; master closes its workers. The parent timeout bounds a defective leaked child and unique sandbox paths are removed only after it ends.
 * @evidence contracts/e2e.md#preserved-coverage The original five cleanup modes and pending/settled report reachability controls retain their literal assertions. One child replaces two child realms; no control is relabeled as a unit or replaced by a source-layout assertion.
 */
const runLifecycle = async ({ sandbox, installation }) => {
  const directory = path.join(sandbox, "benchmark-lifecycle");
  fs.mkdirSync(directory);
  const library = require.resolve("@nestia/benchmark", { paths: [installation.directory] });
  const { createRequire } = require("node:module");
  const tgrid = createRequire(library).resolve("tgrid");
  const worker = path.join(directory, "servant.cjs");
  const entry = path.join(directory, "master.cjs");
  fs.writeFileSync(worker, `
const {WorkerServer}=require(${JSON.stringify(tgrid)});
const server=new WorkerServer();
server.open({execute:async()=>{
  if(process.env.NESTIA_BENCHMARK_MODE==="failure") throw new Error("cleanup RPC failure");
  if(process.env.NESTIA_BENCHMARK_MODE!=="success") {
    for(let i=0;i<500;++i){
      if(await server.getDriver().filter("memory-started")) return [];
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    throw new Error("The memory getter never started.");
  }
  return [];
}}).catch(error=>{console.error(error);process.exitCode=1;});
`);
  fs.writeFileSync(entry, `
const assert=require("node:assert/strict");
const {DynamicBenchmarker}=require(${JSON.stringify(library)});
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const usage={rss:101,heapTotal:102,heapUsed:103,external:104,arrayBuffers:105};
const held={};
async function cleanup(mode){
  process.env.NESTIA_BENCHMARK_MODE=mode;
  let samples=0,release;
  const execution=DynamicBenchmarker.master({
    servant:${JSON.stringify(worker)},count:2,threads:2,simultaneous:2,stdio:"ignore",
    filter:()=>samples>0,
    memory:()=>{
      ++samples;
      if(mode==="getter-reject")return Promise.reject(new Error("sampling refused"));
      if(mode==="pending")return new Promise(resolve=>{release=()=>resolve(usage);});
      return Promise.resolve(usage);
    },
  });
  if(mode==="failure")await assert.rejects(execution,{message:"cleanup RPC failure"});
  else {
    const report=await execution;
    assert.equal(report.statistics.count,0);
    if(mode==="sampled"){
      assert.ok(report.memories.length>0,"active sample was discarded");
      for(const sample of report.memories)assert.strictEqual(sample.usage,usage);
    }else if(mode==="getter-reject"||mode==="pending"){
      assert.equal(samples,1,"gated execution did not invoke the getter");
      assert.deepEqual(report.memories,[]);
      if(mode==="pending"){
        const completed=JSON.stringify(report);
        assert.equal(typeof release,"function");
        release();await new Promise(resolve=>setImmediate(resolve));
        assert.equal(JSON.stringify(report),completed,"pending getter mutated completed report");
      }
    }
  }
  const completedSamples=samples;
  await pause(1100);
  assert.equal(samples,completedSamples,mode+" sampler remained active");
  console.log(mode+" cleanup control passed");
}
async function collect(name,unresolved){
  process.env.NESTIA_BENCHMARK_MODE="gc";
  let calls=0;
  const pending=new Promise(resolve=>{held[name]=resolve;});
  let report=await DynamicBenchmarker.master({
    servant:${JSON.stringify(worker)},count:1,threads:1,simultaneous:1,stdio:"ignore",
    filter:()=>calls===1,
    memory:async()=>{++calls;return unresolved?pending:process.memoryUsage();},
  });
  assert.equal(calls,1,name+" getter invocation");
  assert.equal(report.memories.length,unresolved?0:1,name+" observed samples");
  const weak=new WeakRef(report.memories);report=null;
  let sentinel={};const control=new WeakRef(sentinel);sentinel=null;
  await pause(1100);
  for(let i=0;i<8;++i){global.gc();await pause(0);}
  assert.equal(control.deref(),undefined,name+" collection control");
  assert.equal(weak.deref(),undefined,name+" completed report array release");
  console.log(name+" collection control passed");
}
(async()=>{
  const failures=[];
  try {
    for(const mode of ["success","failure","sampled","getter-reject","pending"])
      try{await cleanup(mode);}catch(error){console.error(error);failures.push(mode);}
    for(const [name,unresolved] of [["pending",true],["settled",false]])
      try{await collect(name,unresolved);}catch(error){console.error(error);failures.push(name+" collection");}
  }finally{for(const resolve of Object.values(held))resolve(process.memoryUsage());await pause(0);}
  if(failures.length)throw new Error("Benchmark lifecycle failures: "+failures.join(", "));
  console.log("cleanup and collection complete");
})().catch(error=>{console.error(error);process.exitCode=1;});
`);
  const output = await new Promise((resolve, reject) => {
    const child = cp.spawn(process.execPath, ["--expose-gc", entry], {
      cwd: sandbox,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let expired = false;
    const timeout = setTimeout(() => {
      expired = true;
      // A defective master may still own servant descendants when the bound
      // expires. Kill the owned tree before outer sandbox teardown proceeds.
      if (process.platform === "win32")
        cp.spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      else {
        try { process.kill(-child.pid, "SIGKILL"); }
        catch (error) { if (error.code !== "ESRCH") child.kill("SIGKILL"); }
      }
    }, 35_000);
    child.stdout.on("data", (chunk) => { stdout += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (expired) reject(new Error("Benchmark lifecycle child exceeded its natural-exit bound."));
      else if (code !== 0) reject(new Error(`Benchmark lifecycle child failed: ${signal ?? code}`));
      else resolve(stdout);
    });
  });
  assert.match(output, /cleanup and collection complete/);
};

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
const runLocations = async ({ sandbox, installation }) => {
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

/**
 * Runs all installed benchmark boundaries while retaining their first failures.
 *
 * HTTP, memory/GC and filesystem discovery need different worker inputs, but
 * share the one installation and both precompiled rich programs.
 *
 * 1. Execute each independent boundary population once.
 * 2. Preserve failures while continuing other populations.
 * 3. Reject the aggregate after all workers and the GC child settle.
 *
 * @evidence contracts/testing.md#behavioral-verification This operation awaits HTTP, lifecycle/GC and discovery assertion owners and rejects their original aggregate failures rather than retrying failed preparation or declaring a later pass.
 * @evidence contracts/testing.md#independent-expectations Each owner states its independent request, literal RPC, caller getter, reachability and authored event oracles; the coordinator adds no implementation-derived expected output.
 * @evidence contracts/testing.md#distinguishing-cases The three independent boundary populations keep separate failure names and continue after an earlier assertion fails. Their individual owners retain positive, negative and boundary controls.
 * @evidence contracts/testing.md#execution-ownership The sole E2E entry awaits this export after its common producer and generated consumer compile and while the same backend is alive.
 * @evidence contracts/e2e.md#necessary-boundary Actual installed worker RPC, HTTP delivery, Node import identity and GC release are owned by the three called populations, not certified by this coordination alone.
 * @evidence contracts/e2e.md#shared-execution All calls reuse the existing packed installation and common producer/consumer builds; one extra GC child replaces the former two memory child realms. No separate workspace start or compiler is used.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Sequential populations own disjoint sandbox paths and restore environment inputs; each master owns worker closure, and the caller removes the sandbox after this operation settles.
 * @evidence contracts/e2e.md#preserved-coverage The campaign ledger maps every former executed assertion to HTTP, lifecycle/GC or discovery owners. Originals remain until the integrated execution gate passes; this coordination does not claim that gate has already run.
 */
const run = async (props) => {
  const failures = [];
  for (const [name, execute] of [["http", runHttp], ["lifecycle", runLifecycle], ["locations", runLocations]]) {
    try { await execute(props); }
    catch (error) { console.error(error); failures.push(name); }
  }
  if (failures.length) throw new Error("Benchmark boundary failures: " + failures.join(", "));
};

module.exports = { run };
