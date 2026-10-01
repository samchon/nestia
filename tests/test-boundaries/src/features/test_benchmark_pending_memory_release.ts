import cp from "child_process";
import fs from "fs";
import path from "path";

/**
 * Verifies a completed master releases its report array while the caller's
 * memory getter promise is still pending.
 *
 * @evidence contracts/testing.md#behavioral-verification A real built master runs one servant and enters a deliberately pending caller getter. The caller drops the completed report; an exposed-GC child asserts its memories array is collectible before that getter resolves, with a settled getter and unrelated object as collection controls.
 * @evidence contracts/testing.md#independent-expectations Once the master returns, only its caller owns the report. A separate caller promise must not retain the master's report array. WeakRef plus V8 GC observes actual reachability independently of the sampler’s state representation; ordinary control collection distinguishes a failed GC opportunity.
 * @evidence contracts/testing.md#distinguishing-cases Both pending and successfully settled getter cases must invoke the getter once and release dropped report arrays. Pending results are resolved only in finally after observation; a sentinel object must collect too. Existing benchmark request and memory late/error cases retain their measurement assertions.
 * @evidence contracts/testing.md#execution-ownership E2E: test-boundaries discovers this callback, which executes the built public benchmark in a Node child with --expose-gc and one real tgrid servant. The callback needs neither package installation nor native compilation.
 * @evidence contracts/e2e.md#necessary-boundary V8 reachability of an actual asynchronous master/sampler realm cannot be established by reading source or inspecting sampler fields. The isolated Node process provides GC access without changing globals in the shared test process.
 * @evidence contracts/e2e.md#shared-execution One GC-enabled Node process and the caller-built public package serve pending and settled controls. Each control opens one servant because the master owns that distinct lifecycle; both reuse one inert servant script and no backend host or network.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique fixture paths own both scripts; each master has a fresh report, getter and worker, and releases its worker before collection. Caller-held promises remain deliberately rooted until finally, then resolve. The parent inherits ordinary environment and removes its owned fixture only after the child exits.
 * @evidence contracts/e2e.md#preserved-coverage This adds the previously absent completed-report reachability distinction while existing benchmark sampling and event cases remain unchanged. It does not replace measurements with object-layout assertions or rebuild packages per case.
 */
export const test_benchmark_pending_memory_release = (): void => {
  const root = path.resolve(process.cwd(), "../..");
  const directory = fs.mkdtempSync(
    path.join(process.cwd(), ".benchmark-memory-"),
  );
  try {
    const library = path.join(root, "packages/benchmark/lib/index.js");
    const worker = path.join(directory, "servant.cjs");
    const entry = path.join(directory, "consumer.cjs");
    fs.writeFileSync(
      worker,
      `
const {createRequire}=require("node:module");
const {WorkerServer}=createRequire(${JSON.stringify(library)})("tgrid");
const server=new WorkerServer();
server.open({execute:async()=>{
  for(let i=0;i<500;++i){
    if(await server.getDriver().filter("memory-started"))return [];
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  throw new Error("The memory getter never started.");
}}).catch(error=>{console.error(error);process.exitCode=1;});
`,
    );
    fs.writeFileSync(
      entry,
      `
const assert=require("node:assert/strict");
const {DynamicBenchmarker}=require(${JSON.stringify(library)});
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const held={};
async function run(name,unresolved){
  let calls=0;
  const pending=new Promise(resolve=>{held[name]=resolve;});
  let report=await DynamicBenchmarker.master({
    count:1,threads:1,simultaneous:1,servant:${JSON.stringify(worker)},stdio:"ignore",
    filter:()=>calls===1,
    memory:async()=>{++calls;return unresolved?pending:process.memoryUsage();},
  });
  assert.equal(calls,1,name+" getter invocation");
  assert.equal(report.memories.length,unresolved?0:1,name+" observed samples");
  const weak=new WeakRef(report.memories);
  report=null;
  let sentinel={};
  const control=new WeakRef(sentinel);
  sentinel=null;
  // This also lets the old successfully settled sampler finish its final wait,
  // keeping that independent control valid before and after the repair.
  await pause(1100);
  for(let i=0;i<8;++i){global.gc();await pause(0);}
  assert.equal(control.deref(),undefined,name+" collection control");
  assert.equal(weak.deref(),undefined,name+" completed report array release");
}
(async()=>{
  try{await run("pending",true);await run("settled",false);}
  finally{for(const resolve of Object.values(held))resolve(process.memoryUsage());await pause(0);}
})().catch(error=>{console.error(error);process.exitCode=1;});
`,
    );
    cp.execFileSync(process.execPath, ["--expose-gc", entry], {
      cwd: directory,
      stdio: "pipe",
      timeout: 20_000,
      windowsHide: true,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
