const { test_benchmark_http_connection: runHttp } = require("./test_benchmark_http_connection.cjs");
const { test_benchmark_worker_lifetimes: runLifecycle } = require("./test_benchmark_worker_lifetimes.cjs");
const { test_benchmark_worker_discovery: runLocations } = require("./test_benchmark_worker_discovery.cjs");
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
