import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {test} from "node:test";

/**
 * Verifies the unit runner executes isolated populations after either fails.
 *
 * A browser runtime needs an independent module/global lifetime, and a failed
 * utility process must not suppress its results. Actual Node children expose
 * both isolation and final failure aggregation through a fixture compiler.
 *
 * 1. Run all-success, utility-failure and browser-failure child scenarios.
 * 2. Require every package entry, the editor browser entry, shared caches and an absent sibling-owned global.
 * 3. Require only all-success to return zero and remove the owned fixture.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual runUnit operation launches real Node fixture-tool children selected through a fixture ttsx manifest. Their log exposes delivered entries, cache environment and process-local state; literal exits detect early bail, success substitution or sharing a single global lifetime.
 * @evidence contracts/testing.md#independent-expectations All eight package entries and the editor browser entry must run; either authored child failure makes the aggregate fail, and one process's own global must be absent from its sibling. The fixture controls these inputs and records child observations rather than inferring them from runner source.
 * @evidence contracts/testing.md#distinguishing-cases All-success, first-unit-failure and browser-failure cover both aggregate branches and continuation. Each checks all nine observed entries, equivalent cache delivery and fresh process state; canonical unit execution separately proves real compiler/component behavior.
 * @evidence contracts/testing.md#execution-ownership Node's test runner discovers this matching test-evidence export and executes real child processes in an owned fixture; every invocation settles before finally removes it. It is an orchestration process boundary, not a substitute compiler or product-component acceptance test.
 * @evidence contracts/e2e.md#necessary-boundary In-process callbacks cannot establish independent process globals or real exit aggregation; actual Node children connect the runner's manifest resolution, argv, environment and process results.
 * @evidence contracts/e2e.md#shared-execution One fixture compiler per package workspace serves three scenarios, without pnpm installation or native compilation. Each scenario owns a fresh observation log and nine actual children.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each child has a fresh process lifetime and each scenario removes its preceding observation log. The unique owned root is removed only after all synchronous driver invocations have settled.
 * @evidence contracts/e2e.md#preserved-coverage This adds isolation and both failure-order checks; existing root/E2E/Evidence orchestration cases retain their assertions, and canonical units retain real source discovery and component regression checks.
 */
export function test_unit_runner_collects_failures() {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-unit-runner-"));
  try {
    const log = path.join(directory, "observed.jsonl");
    const suites = ["test-core", "test-sdk", "test-fetcher", "test-migrate", "test-e2e", "test-benchmark", "test-editor", "test-nestia"];
    for (const suite of suites) {
      const compiler = path.join(directory, "tests", suite, "node_modules/ttsc");
      fs.mkdirSync(compiler, {recursive: true});
      fs.writeFileSync(path.join(compiler, "package.json"), JSON.stringify({name: "ttsc", bin: {ttsx: "fixture.cjs"}}));
      fs.writeFileSync(path.join(compiler, "fixture.cjs"), `
const fs = require("node:fs");
const entry = process.argv[2];
fs.appendFileSync(process.env.UNIT_FIXTURE_LOG, JSON.stringify({entry, suite: require("node:path").basename(process.cwd()), sibling: typeof globalThis.ownedUnitMarker, cache: process.env.TTSC_CACHE_DIR, goCache: process.env.GOCACHE}) + "\\n");
globalThis.ownedUnitMarker = entry;
process.exitCode = entry.includes("browser") ? Number(process.env.UNIT_BROWSER_EXIT) : (process.cwd().endsWith("test-core") ? Number(process.env.UNIT_UTILITY_EXIT) : 0);
      `);
    }
    const driver = path.join(directory, "driver.cjs");
    fs.writeFileSync(driver, `process.exitCode = require(${JSON.stringify(path.join(repository, "scripts/run-unit.cjs"))}).runUnit(${JSON.stringify(directory)});`);
    for (const [utility, browser] of [[0, 0], [1, 0], [0, 1]]) {
      fs.rmSync(log, {force: true});
      const result = spawnSync(process.execPath, [driver], {
        cwd: directory,
        encoding: "utf8",
        windowsHide: true,
        timeout: 30_000,
        env: {...process.env, UNIT_FIXTURE_LOG: log, UNIT_UTILITY_EXIT: String(utility), UNIT_BROWSER_EXIT: String(browser)},
      });
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      assert.equal(result.status, utility || browser ? 1 : 0, result.stdout + result.stderr);
      const observed = fs.readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line));
      assert.deepEqual(observed.map(value => `${value.suite}/${value.entry}`), [
        "test-core/src/index.ts", "test-sdk/src/index.ts", "test-fetcher/src/index.ts",
        "test-migrate/src/index.ts", "test-e2e/src/index.ts", "test-benchmark/src/index.ts",
        "test-editor/src/index.ts", "test-editor/src/browser/index.ts", "test-nestia/src/index.ts",
      ]);
      assert.deepEqual(observed.map(value => value.sibling), Array(9).fill("undefined"));
      assert.deepEqual(observed.map(value => value.cache), Array(9).fill(path.join(directory, "node_modules/.cache/ttsc")));
      assert.deepEqual(observed.map(value => value.goCache), Array(9).fill(path.join(directory, "node_modules/.cache/ttsc/go-build")));
    }
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    assert.ok(path.basename(directory).startsWith("nestia-unit-runner-"));
    fs.rmSync(directory, {recursive: true, force: true});
  }
}
test("test_unit_runner_collects_failures", test_unit_runner_collects_failures);
