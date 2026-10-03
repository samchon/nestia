const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runTestPhases } = require("./run-tests.cjs");
const { runIntegrationPhases } = require("./run-integration.cjs");

/**
 * Verifies independent test failures remain visible without using stale builds.
 *
 * A shell AND chain previously suppressed later populations after a Go failure.
 * The orchestration owner must retain all independent results while enforcing
 * the package-artifact prerequisite; command execution itself is its boundary.
 *
 * 1. Supply phase outcomes through the orchestration's native-process boundary.
 * 2. Verify failures do not suppress independent phases and remain in the result.
 * 3. Fail the build and require artifact consumers to be explicitly blocked.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual runTestPhases invokes a recording execution boundary under success, Evidence/Go/package-unit failures, build failure and workspace failure. Canonical Go and integration commands remain selected. The integration plan forwards no-plugins, skip-build and every first status through one boundary call; separate shared-integration cases own independent continuation.
 * @evidence contracts/testing.md#independent-expectations Independent populations must execute after test failures; only a failed build invalidates its artifact consumers. Literal phase counts and statuses follow those prerequisites, not current source text or repository file arrangement.
 * @evidence contracts/testing.md#distinguishing-cases All-success returns zero, multiple independent failures retain exit two while later integration execution continues, build failure still executes Evidence/Go/runner units but blocks artifact populations, and a final integration failure returns one. The canonical integration plan preserves statuses zero/one/two, no-plugins and skip-build; the full plan invokes it only after its successful build.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through Node test in the canonical root runner-unit phase. It directly exercises portable orchestration with an authored process-result boundary and creates no consumer, compiler, child process or server.
 */
function test_run_test_phases() {
  const phases = [
    "build",
    "Evidence",
    "Go units",
    "JavaScript units",
    "test workspaces",
  ];
  for (const scenario of [
    { statuses: {}, result: 0, expected: phases },
    {
      statuses: { Evidence: 2, "Go units": 1, "JavaScript units": 1 },
      result: 2,
      expected: phases,
    },
    {
      statuses: { build: 1 },
      result: 1,
      expected: [...phases.slice(0, 3), "runner units"],
    },
    { statuses: { "test workspaces": 1 }, result: 1, expected: phases },
  ]) {
    const calls = [];
    const status = runTestPhases((name, args, env) => {
      calls.push(name);
      assert(args.length > 0, `${name}: no command`);
      assert.equal(env, undefined);
      if (name === "test workspaces")
        assert.deepEqual(args, ["run", "test:e2e"]);
      if (name === "Go units") assert.deepEqual(args, ["run", "test:go"]);
      return scenario.statuses[name] ?? 0;
    });
    assert.deepEqual(calls, scenario.expected);
    assert.equal(status, scenario.result);
  }
  for (const status of [0, 1, 2]) {
    let calls = 0;
    assert.equal(
      runIntegrationPhases((_name, args, env) => {
        ++calls;
        assert(args.includes("--no-plugins"), "test-language entry must not compile product fixtures");
        assert.deepEqual(env, { TEST_SDK_SKIP_BUILD: "1" });
        return status;
      }),
      status,
    );
    assert.equal(calls, 1, "integration preparation is never retried");
  }
}

module.exports = { test_run_test_phases };
if (require.main === module) test("test_run_test_phases", test_run_test_phases);
