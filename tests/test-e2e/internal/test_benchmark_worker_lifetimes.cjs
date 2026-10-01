const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const cp = require("node:child_process");

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
const test_benchmark_worker_lifetimes = async ({ sandbox, installation }) => {
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

module.exports = { test_benchmark_worker_lifetimes };
