const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runTestPhases } = require("./run-tests.cjs");

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
 * @evidence contracts/testing.md#behavioral-verification Actual runTestPhases invokes a recording execution boundary under success, Evidence/Go/package-unit failures, build failure and workspace failure. Observed calls and final statuses distinguish continuation from premature short circuit or false success.
 * @evidence contracts/testing.md#independent-expectations Independent populations must execute after test failures; only a failed build invalidates its artifact consumers. Literal phase counts and statuses follow those prerequisites, not current source text or repository file arrangement.
 * @evidence contracts/testing.md#distinguishing-cases All-success returns zero, multiple independent failures retain exit two while later workspace execution continues, build failure still executes Evidence/Go/runner units but blocks both artifact populations, and a final workspace failure returns one. Skip-build reaches consumers only after successful build.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs through Node test in the canonical root runner-unit phase. It directly exercises portable orchestration with an authored process-result boundary and creates no consumer, compiler, child process or server.
 */
function test_run_test_phases() {
  const phases = [
    "build",
    "Evidence",
    "Go units",
    "runner units",
    "package JavaScript units",
    "test workspaces",
  ];
  for (const scenario of [
    { statuses: {}, result: 0, expected: phases },
    {
      statuses: { Evidence: 2, "Go units": 1, "package JavaScript units": 1 },
      result: 2,
      expected: phases,
    },
    { statuses: { build: 1 }, result: 1, expected: phases.slice(0, 4) },
    { statuses: { "test workspaces": 1 }, result: 1, expected: phases },
  ]) {
    const calls = [];
    const status = runTestPhases((name, args, env) => {
      calls.push(name);
      assert(args.length > 0, `${name}: no command`);
      if (name === "test workspaces")
        assert.deepEqual(env, { TEST_SDK_SKIP_BUILD: "1" });
      else assert.equal(env, undefined);
      return scenario.statuses[name] ?? 0;
    });
    assert.deepEqual(calls, scenario.expected);
    assert.equal(status, scenario.result);
  }
}

module.exports = { test_run_test_phases };
if (require.main === module) test("test_run_test_phases", test_run_test_phases);
