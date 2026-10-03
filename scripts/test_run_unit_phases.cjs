const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runUnitPhases } = require("./run-unit.cjs");

/**
 * Verifies a failed unit population does not suppress other unit owners.
 *
 * Root, package and workspace units have independent assertions. Aggregation
 * must retain incomplete-analysis status two and execute each population once.
 *
 * 1. Supply success and separate or simultaneous failure statuses.
 * 2. Require all three execution boundaries and the highest observed status.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual runUnitPhases calls all three execution boundaries and returns their maximum first status, including failures in the first and last populations.
 * @evidence contracts/testing.md#independent-expectations Independent owners must execute after another owner's failure. Authored statuses zero, one and two establish the literal expected result independently of the implementation.
 * @evidence contracts/testing.md#distinguishing-cases All-success, runner-only, package-only, workspace-only and simultaneous failures distinguish continuation and failure precedence; each command executes exactly once.
 * @evidence contracts/testing.md#execution-ownership Node test discovers this matching case through the canonical root runner population. It calls portable orchestration through an authored execution boundary without creating a child, compiler, consumer or host.
 */
function test_run_unit_phases() {
  const phases = [
    "runner units",
    "package JavaScript units",
    "workspace JavaScript units",
  ];
  for (const statuses of [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [2, 1, 1],
  ]) {
    const calls = [];
    const result = runUnitPhases((name, args) => {
      assert(args.length > 0);
      calls.push(name);
      return statuses[phases.indexOf(name)];
    });
    assert.deepEqual(calls, phases);
    assert.equal(result, Math.max(...statuses));
  }
}

module.exports = { test_run_unit_phases };
if (require.main === module) test("test_run_unit_phases", test_run_unit_phases);
