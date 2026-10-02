const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

/**
 * Verifies process-owned SDK materializations survive a sibling's normal or failing exit.
 *
 * Explicit registry removal cannot prove the registered process exit hook or
 * isolation between two live owners of the same configuration/runtime parents.
 *
 * 1. Acquire two IPC handshakes after original allocation/release assertions.
 * 2. Exit one owner, observe its absence and the survivor's literal live markers.
 * 3. Exit the survivor and retain both shared parents, in both exit orders.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual installed TemporaryDirectory create/remove and process exit hooks must remove only each exiting consumer's two children. Explicit transient release, repeated release rejection, unowned parent rejection and both exact exit statuses remain observable.
 * @evidence contracts/testing.md#independent-expectations The creator owns its mkdtemp child, while a simultaneously live sibling owns separate live marker files. Literal 0/23 statuses and live marker text determine the expected observations independently of registry internals.
 * @evidence contracts/testing.md#distinguishing-cases Normal-first/error-last and error-first/normal-last use two owners each. Both config-loader/runtime children and explicit transient removal are retained; abrupt OS termination is teardown only and is not claimed to run JavaScript cleanup hooks.
 * @evidence contracts/testing.md#execution-ownership The sole installed E2E entry awaits this matching export. It resolves the published SDK utility from its shared installation and awaits four actual Node consumers without invoking a legacy runner.
 * @evidence contracts/e2e.md#necessary-boundary Two independently terminable process owners and IPC handshakes expose exit-hook and sibling-deletion defects that direct registry units cannot prove.
 * @evidence contracts/e2e.md#shared-execution Four plain Node consumers reuse one installed artifact and one worker source; pack/install/compiler/generator/backend additions are zero.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique canonical native temporary root owns both orders independently of rich sandbox cleanup. Children enter the owned list immediately after spawn, every wait has a cleared failure deadline, teardown kills only live owned children and awaits close before deleting its verified root. An unresolved close records the retained root and fails instead of removing a live owner's tree.
 * @evidence contracts/e2e.md#preserved-coverage Both original exit orders, four child lifetimes, two materialization parents, transient release/repeated/unowned rejection, survivor markers and final shared-parent preservation remain; original files stay until actual execution acceptance.
 * @evidence contracts/common.md#principled-implementation The original worker directly exercises installed registry allocation/removal and its real exit hook. Native marker reads after independently ordered exits establish sibling ownership; private bounded waits and closed-state observations coordinate actual IPC owners without invoking registry internals.
 * @evidence contracts/common.md#clear-and-simple-design One export owns one worker source and two explicit exit orders. Each spawn is tracked before acquisition is awaited, and one bounded-wait helper consistently clears deadlines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual child processes receive exit requests over IPC. No registry, process method or cleanup hook is patched; abrupt forced teardown is never accepted as the expected normal/error exit result.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes normal process-hook verification from forced failure teardown, names both original order controls and states the artifact/module lifetime owner.
 * @evidence contracts/performance.md#efficient-algorithms Fixed two orders and two owners per order bound process count. Handshakes retain only two native paths per child, stderr is capped at 65536 characters per owner, and each marker/parent is observed once at its required transition.
 * @evidence contracts/performance.md#reuse-equivalent-work One installed registry module and worker script serve all consumers; process exit orders and concurrently owned mutable directories are distinct effects and cannot be merged into one child lifetime.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquisition registers every child immediately; bounded waits clear timers, teardown signals only live owned children and awaits close with failure escalation. Unresolved close records failure and retains the native root plus installed modules and sandbox through the runner callback. Only that failed branch releases parent IPC/stderr refs and unrefs owned children; it never records close as observed or claims completed cleanup.
 * @evidence contracts/portability.md#os-neutral-implementation Node spawn/IPC, native path.join/mkdtemp and filesystem marker reads preserve platform paths. Expected cleanup uses process.exit(0/23) rather than platform signal semantics; forced SIGKILL belongs only to failed teardown and is not an oracle for exit-hook behavior.
 */
const test_sdk_temporary_directory_ownership = async ({ installation, sandbox, record, retainResources }) => {
  const manifest = require.resolve("@nestia/sdk/package.json", { paths: [installation.directory] });
  const moduleFile = path.join(path.dirname(manifest), "lib/utils/TemporaryDirectory.js");
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, "nestia-temp-owner-"));
  const removeOwnedRoot = () => {
    assert.equal(fs.realpathSync(path.dirname(root)), base);
    assert.ok(path.basename(root).startsWith("nestia-temp-owner-"));
    assert.equal(fs.realpathSync(root), root);
    fs.rmSync(root, { recursive: true, force: true });
  };
  const worker = path.join(root, "worker.cjs");
  try { fs.writeFileSync(worker, `
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { TemporaryDirectory } = require(process.argv[2]);
const root = process.argv[3];
const parents = [path.join(root, "config-loader"), path.join(root, "runtime")];
const children = parents.map(parent => TemporaryDirectory.create(parent, "run-"));
for (const child of children) fs.writeFileSync(path.join(child, "marker"), "live");
const transient = TemporaryDirectory.create(parents[0], "tsconfig-");
TemporaryDirectory.remove(transient);
assert.equal(fs.existsSync(transient), false);
assert.throws(() => TemporaryDirectory.remove(transient), /Unowned temporary directory/);
assert.throws(() => TemporaryDirectory.remove(parents[0]), /Unowned temporary directory/);
process.on("message", code => process.exit(code));
process.send({ children, parents });
`); } catch (error) {
    try { removeOwnedRoot(); }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], `SDK worker preparation failed; owned root: ${root}`); }
    throw error;
  }
  const bounded = async (promise) => {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("SDK consumer lifecycle timed out")), 5000);
      })]);
    } finally { clearTimeout(timer); }
  };
  const launched = [];
  const outcomes = [];
  const failures = [];
  for (const codes of [[0, 23], [23, 0]]) {
    const consumers = [];
    try {
      const directory = fs.mkdtempSync(path.join(root, "order-"));
      for (let i = 0; i < 2; i++) {
        const child = cp.spawn(process.execPath, [worker, moduleFile, directory], { windowsHide: true, stdio: ["ignore", "ignore", "pipe", "ipc"] });
        const entry = { child, closed: false, diagnostics: "" };
        consumers.push(entry);
        launched.push(entry);
        child.stderr.on("data", (data) => { entry.diagnostics = (entry.diagnostics + String(data)).slice(-65536); });
        entry.close = new Promise((resolve) => child.once("close", (code, signal) => { entry.closed = true; resolve({ code, signal }); }));
        entry.ready = new Promise((resolve, reject) => {
          child.once("error", reject);
          child.once("message", resolve);
          child.once("close", () => reject(new Error(`Consumer exited before handshake: ${entry.diagnostics}`)));
        });
        // Acquisition failures may precede awaiting the second child.
        entry.ready.catch(() => {});
      }
      const [first, second] = await bounded(Promise.all(consumers.map((entry) => entry.ready)));
      consumers[0].child.send(codes[0]);
      const exited = await bounded(consumers[0].close);
      assert.equal(exited.signal, null);
      assert.equal(exited.code, codes[0]);
      for (const directory of first.children) assert.equal(fs.existsSync(directory), false);
      for (const directory of second.children) assert.equal(fs.readFileSync(path.join(directory, "marker"), "utf8"), "live");
      consumers[1].child.send(codes[1]);
      const survivor = await bounded(consumers[1].close);
      assert.equal(survivor.signal, null);
      assert.equal(survivor.code, codes[1]);
      for (const directory of second.children) assert.equal(fs.existsSync(directory), false);
      for (const parent of first.parents) assert.equal(fs.statSync(parent).isDirectory(), true);
      outcomes.push({ codes, status: "success", first, second, exited, survivor });
    } catch (error) {
      failures.push(error);
      outcomes.push({ codes, status: "failure", error: { name: error.name, message: error.message, stack: error.stack } });
    } finally {
      for (const entry of consumers) if (!entry.closed && entry.child.exitCode === null && entry.child.signalCode === null) entry.child.kill();
      try { await bounded(Promise.all(consumers.map((entry) => entry.close))); }
      catch (error) {
        failures.push(error);
        for (const entry of consumers) if (!entry.closed && entry.child.exitCode === null && entry.child.signalCode === null) entry.child.kill("SIGKILL");
        try { await bounded(Promise.all(consumers.map((entry) => entry.close))); }
        catch (closeError) { failures.push(closeError); }
      }
    }
  }
  try { await bounded(Promise.all(launched.map((entry) => entry.close))); }
  catch (error) { failures.push(error); }
  const unresolved = launched.filter((entry) => !entry.closed);
  if (unresolved.length) {
    retainResources({
      operation: "sdk_temporary_directory_ownership", root, sandbox,
      installation: installation.directory, closeObserved: false,
      owners: unresolved.map((entry) => ({ pid: entry.child.pid, exitCode: entry.child.exitCode, signalCode: entry.child.signalCode, diagnostics: entry.diagnostics })),
    });
    // These are failure teardown steps, not evidence of observed child close.
    for (const entry of unresolved) {
      try { if (entry.child.connected) entry.child.disconnect(); }
      catch (error) { failures.push(error); }
      entry.child.stderr.destroy();
      entry.child.unref();
    }
  }
  try { record("sdk-temporary-directory-ownership.json", { root, retained: launched.some((entry) => !entry.closed), outcomes, spawnAttempts: launched.length, childRealms: launched.filter((entry) => entry.child.pid !== undefined).length, closed: launched.filter((entry) => entry.closed).length }); }
  catch (error) { failures.push(error); }
  if (launched.every((entry) => entry.closed)) {
    try {
      removeOwnedRoot();
    } catch (error) { failures.push(error); }
  } else failures.push(new Error(`SDK consumers did not close; owned directory retained: ${root}`));
  if (failures.length) throw new AggregateError(failures, "SDK temporary directory ownership failed.");
};

module.exports = { test_sdk_temporary_directory_ownership };
