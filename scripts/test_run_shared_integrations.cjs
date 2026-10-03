const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runSharedIntegrations } = require("./run-integration.cjs");

/**
 * Verifies shared preparation preserves independent integration failures.
 *
 * Owners may reuse a validated graph after another owner fails; an unavailable
 * graph blocks both. Neither failure permits replay or a false success result.
 *
 * 1. Supply a prepared context and each combination of owner failures.
 * 2. Require once-only preparation, ordered continuation and unchanged context.
 * 3. Reject preparation and require that no consumer executes.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual shared orchestration awaits preparation once, passes the identical context to both owners in order, continues after each failure and returns failure when any owner or preparation rejects.
 * @evidence contracts/testing.md#independent-expectations A valid prerequisite permits both independent owners; a failed prerequisite permits neither. Literal calls and exit zero/one follow these dependency rules rather than implementation text.
 * @evidence contracts/testing.md#distinguishing-cases All-success, SDK-only, migration-only and simultaneous failures require both owners exactly once. A preparation rejection requires no owner, and the second owner observes the first owner's completed state rather than concurrent execution.
 * @evidence contracts/testing.md#execution-ownership Node test discovers the matching exported case in the root runner-unit population. Authored asynchronous boundaries exercise orchestration without installing packages, invoking children or starting a compiler or host.
 */
async function test_run_shared_integrations() {
  for (const failures of [[false, false], [true, false], [false, true], [true, true]]) {
    const calls = [];
    const context = {};
    const status = await runSharedIntegrations(async () => {
      calls.push("prepare");
      return context;
    }, [0, 1].map((index) => [String(index), async (actual) => {
      assert.equal(actual, context);
      assert.deepEqual(calls, index === 0 ? ["prepare"] : ["prepare", "0"]);
      await Promise.resolve();
      calls.push(String(index));
      if (failures[index]) throw new Error(`authored owner ${index} failure`);
    }]));
    assert.deepEqual(calls, ["prepare", "0", "1"]);
    assert.equal(status, failures.some(Boolean) ? 1 : 0);
  }
  let executed = false;
  assert.equal(await runSharedIntegrations(async () => {
    throw new Error("authored preparation failure");
  }, [["blocked", async () => { executed = true; }]]), 1);
  assert.equal(executed, false);
}

module.exports = { test_run_shared_integrations };
if (require.main === module) test("test_run_shared_integrations", test_run_shared_integrations);
