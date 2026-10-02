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
 * 1. Run success, child-failure, missing-manifest and malformed-manifest scenarios.
 * 2. Require every available package entry, the editor browser entry, shared caches and an absent sibling-owned global.
 * 3. Require only all-success to return zero and remove the owned fixture.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual runUnit operation launches real Node fixture-tool children selected through a fixture ttsx manifest. Their log exposes delivered entries, cache environment and process-local state; literal exits detect early bail, success substitution or sharing a single global lifetime.
 * @evidence contracts/testing.md#independent-expectations All six pure-unit entries and the editor browser entry run under valid setup; rejected first-workspace setup preserves the remaining six entries. Either authored child or setup failure makes the aggregate fail, and one process's own global must be absent from its sibling. The fixture controls these inputs and records child observations rather than inferring them from runner source.
 * @evidence contracts/testing.md#distinguishing-cases All-success, first-unit-failure and browser-failure cover both aggregate branches and continuation. Missing and malformed first-workspace manifests must fail while the other six entries still run. Every observed entry checks equivalent cache delivery and fresh process state; canonical unit execution separately proves real compiler/component behavior.
 * @evidence contracts/testing.md#execution-ownership Node's test runner discovers this matching test-e2e process export and executes real child processes in an owned fixture; every invocation settles before finally removes it. It is an orchestration process boundary, not a substitute compiler or product-component acceptance test.
 * @evidence contracts/e2e.md#necessary-boundary In-process callbacks cannot establish independent process globals or real exit aggregation; actual Node children connect the runner's manifest resolution, argv, environment and process results.
 * @evidence contracts/e2e.md#shared-execution One fixture compiler per package workspace serves five scenarios, without pnpm installation or native compilation. Each scenario owns a fresh observation log; valid setup launches seven children and rejected first-workspace setup leaves six available children.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each child has a fresh process lifetime and each scenario removes its preceding observation log. The unique owned root is removed only after all synchronous driver invocations have settled.
 * @evidence contracts/e2e.md#preserved-coverage This adds isolation and both failure-order checks; existing root/E2E/Evidence orchestration cases retain their assertions, and canonical units retain real source discovery and component regression checks.
 */
export function test_unit_runner_collects_failures() {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-unit-runner-"));
  try {
    const log = path.join(directory, "observed.jsonl");
    const suites = ["test-transform-options", "test-sdk", "test-migrate", "test-benchmark", "test-editor", "test-cli"];
    for (const suite of suites) {
      const compiler = path.join(directory, "tests", suite, "node_modules/ttsc");
      fs.mkdirSync(compiler, {recursive: true});
      fs.writeFileSync(path.join(compiler, "package.json"), JSON.stringify({name: "ttsc", bin: {ttsx: "fixture.cjs"}}));
      fs.writeFileSync(path.join(compiler, "fixture.cjs"), `
const fs = require("node:fs");
const entry = process.argv[2];
fs.appendFileSync(process.env.UNIT_FIXTURE_LOG, JSON.stringify({entry, suite: require("node:path").basename(process.cwd()), sibling: typeof globalThis.ownedUnitMarker, cache: process.env.TTSC_CACHE_DIR, goCache: process.env.GOCACHE}) + "\\n");
globalThis.ownedUnitMarker = entry;
process.exitCode = entry.includes("browser") ? Number(process.env.UNIT_BROWSER_EXIT) : (process.cwd().endsWith("test-transform-options") ? Number(process.env.UNIT_UTILITY_EXIT) : 0);
      `);
    }
    const driver = path.join(directory, "driver.cjs");
    fs.writeFileSync(driver, `process.exitCode = require(${JSON.stringify(path.join(repository, "scripts/run-unit.cjs"))}).runUnit(${JSON.stringify(directory)});`);
    const firstManifest = path.join(directory, "tests/test-transform-options/node_modules/ttsc/package.json");
    const manifestBytes = fs.readFileSync(firstManifest);
    for (const [utility, browser, preparation] of [[0, 0, "valid"], [1, 0, "valid"], [0, 1, "valid"], [0, 0, "missing"], [0, 0, "malformed"]]) {
      fs.writeFileSync(firstManifest, manifestBytes);
      if (preparation === "missing") fs.rmSync(firstManifest);
      if (preparation === "malformed") fs.writeFileSync(firstManifest, "{");
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
      assert.equal(result.status, utility || browser || preparation !== "valid" ? 1 : 0, result.stdout + result.stderr);
      if (preparation !== "valid") {
        assert.match(result.stderr, /Unable to prepare unit population: test-transform-options/);
        assert.match(result.stderr, preparation === "missing" ? /MODULE_NOT_FOUND/ : /ERR_INVALID_PACKAGE_CONFIG|SyntaxError/);
      }
      assert.ok(fs.existsSync(log), `No independent unit population ran:\n${result.stdout}${result.stderr}`);
      const observed = fs.readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line));
      const expected = [
        "test-transform-options/src/index.ts", "test-sdk/src/index.ts",
        "test-migrate/src/index.ts", "test-benchmark/src/index.ts",
        "test-editor/src/index.ts", "test-editor/src/browser/index.ts", "test-cli/src/index.ts",
      ];
      if (preparation !== "valid") expected.shift();
      assert.deepEqual(observed.map(value => `${value.suite}/${value.entry}`), expected);
      assert.deepEqual(observed.map(value => value.sibling), Array(expected.length).fill("undefined"));
      assert.deepEqual(observed.map(value => value.cache), Array(expected.length).fill(path.join(directory, "node_modules/.cache/ttsc")));
      assert.deepEqual(observed.map(value => value.goCache), Array(expected.length).fill(path.join(directory, "node_modules/.cache/ttsc/go-build")));
    }
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    assert.ok(path.basename(directory).startsWith("nestia-unit-runner-"));
    fs.rmSync(directory, {recursive: true, force: true});
  }
}
test("test_unit_runner_collects_failures", test_unit_runner_collects_failures);
