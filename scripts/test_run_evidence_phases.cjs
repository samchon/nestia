const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runEvidencePhases } = require("./run-evidence.cjs");

/**
 * Verifies every Evidence owner executes despite another owner's rejection.
 *
 * A package-only entry omitted root and workspace-unit declarations. One
 * acknowledgment failure must also leave later independent reports visible.
 *
 * 1. Supply success, each single failure and simultaneous distinct failures.
 * 2. Require all three owners once and the complete aggregate exit status.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual runEvidencePhases calls all three recording boundaries once under success, each individual rejected population and simultaneous failures, returning the maximum first status.
 * @evidence contracts/testing.md#independent-expectations Three maintained declaration owners require independent source checks. Literal authored statuses zero/one/two establish success and error aggregation independently of actual report text.
 * @evidence contracts/testing.md#distinguishing-cases Each owner individually rejects and a simultaneous one/two case distinguishes later-population suppression from false aggregate success. All-success separately requires zero.
 * @evidence contracts/testing.md#execution-ownership The matching function runs through canonical root Node units. It directly exercises portable population selection using an authored process-result boundary, without invoking Evidence, compiling source or starting a child.
 */
function test_run_evidence_phases() {
  const owners = [
    "root Evidence",
    "package Evidence",
    "workspace unit Evidence",
  ];
  const commands = [
    ["exec", "evidence", "--config", "evidence.config.json"],
    [
      "--filter=./packages/*",
      "--fail-if-no-match",
      "-r",
      "--no-bail",
      "--workspace-concurrency=1",
      "run",
      "evidence",
    ],
    ["exec", "evidence", "--config", "tests/evidence.config.json"],
  ];
  for (const statuses of [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 2, 1],
  ]) {
    const calls = [];
    const result = runEvidencePhases((name, args) => {
      assert.deepEqual(args, commands[calls.length]);
      calls.push(name);
      return statuses[calls.length - 1];
    });
    assert.deepEqual(calls, owners);
    assert.equal(result, Math.max(...statuses));
  }
}

module.exports = { test_run_evidence_phases };
if (require.main === module)
  test("test_run_evidence_phases", test_run_evidence_phases);
