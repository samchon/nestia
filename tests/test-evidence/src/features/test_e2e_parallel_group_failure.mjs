import assert from "node:assert/strict";
import cp from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

/**
 * Verifies the actual pnpm parallel dispatcher waits for a peer after failure.
 *
 * A failed lightweight suite must make the group fail while another member
 * finishes its own assertions. No package installation or native build is
 * needed to exercise that command and child-lifetime boundary.
 *
 * 1. Create two actual fixture workspace scripts: an immediate failure and a
 *    successful peer with delayed completion.
 * 2. Run the caller's pnpm entry with parallel execution and no early bail.
 * 3. Require nonzero group status and both starts plus the peer's completion.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual installed pnpm CLI launches two real Node fixture scripts; nonzero status and a completed peer marker distinguish omitted execution, lost failure status and returning before a surviving member finishes.
 * @evidence contracts/testing.md#independent-expectations One authored script exits 1 and the other records start and completion before succeeding; the group must report failure while preserving that successful member's full execution.
 * @evidence contracts/testing.md#distinguishing-cases An immediate failing member and a delayed successful peer share one dispatch; exact event membership and count require each member to execute once, independent of start order.
 * @evidence contracts/testing.md#execution-ownership Node discovers this matching test-evidence export and invokes the actual caller-supplied pnpm launcher, without changing its methods or recursively running product suites.
 * @evidence contracts/e2e.md#necessary-boundary Real pnpm process ownership and exit aggregation are the behavior under test; the existing runner fixture proves argument delivery but cannot prove the package manager waits for its children after failure.
 * @evidence contracts/e2e.md#shared-execution One tiny workspace and one pnpm invocation serve both members; plain Node scripts use no dependencies, installations, servers or native artifacts.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A unique absolute temporary root owns the manifest, scripts and event log. The bounded synchronous parent waits for process closure before finally removes only that verified root; each fixture child finishes within its authored short delay.
 * @evidence contracts/e2e.md#preserved-coverage This adds actual dispatcher failure/completion evidence alongside runner continuation, build dependency and cache tests; every product assertion remains in its owning suite.
 */
export const test_e2e_parallel_group_failure = () => {
  const launcher = process.env.npm_execpath;
  assert.ok(launcher, "Run this case through pnpm start.");
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, "nestia-parallel-group-"));
  const log = path.join(root, "events.jsonl");
  try {
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ private: true }));
    fs.writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - first\n  - peer\n");
    for (const name of ["first", "peer"]) {
      const directory = path.join(root, name);
      fs.mkdirSync(directory);
      fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ name: `fixture-${name}`, version: "0.0.0", scripts: { start: "node start.cjs" } }));
      fs.writeFileSync(path.join(directory, "start.cjs"),
        `const fs = require("node:fs");\nconst record = value => fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(value) + "\\n");\n` +
        (name === "first" ? 'record("first-start"); process.exitCode = 1;\n' : 'record("peer-start"); setTimeout(() => record("peer-complete"), 150);\n'));
    }
    const result = cp.spawnSync(process.execPath, [launcher, "--filter", "fixture-first", "--filter", "fixture-peer", "-r", "--parallel", "--no-bail", "run", "start"], {
      cwd: root,
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
    });
    assert.equal(result.error, undefined, String(result.error));
    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    const events = fs.readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    assert.deepEqual(events.slice().sort(), ["first-start", "peer-complete", "peer-start"]);
    assert.ok(events.indexOf("peer-start") < events.indexOf("peer-complete"));
  } finally {
    assert.equal(path.dirname(root), base);
    assert.ok(path.basename(root).startsWith("nestia-parallel-group-"));
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("Parallel pnpm group preserves peer completion after failure", test_e2e_parallel_group_failure);
