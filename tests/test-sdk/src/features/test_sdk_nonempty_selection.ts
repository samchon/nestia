import assert from "node:assert/strict";

const {
  assertSdkFeaturesSelected,
} = require("../integration/internal/SdkFixtureDiscovery.js");

/**
 * Verifies an empty SDK execution plan fails without changing valid plans.
 *
 * Filters can remove every discovered or synthetic owner. That command has
 * executed no tests and must fail before expensive integration preparation.
 *
 * 1. Reject an empty selected plan with an actionable diagnostic.
 * 2. Accept singleton and mixed fixture/cohort plans without mutating them.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual execution guard throws for zero owners and accepts populated plans, retaining their membership and order.
 * @evidence contracts/testing.md#independent-expectations A test command cannot prove coverage without executing a test. Literal authored plans establish the zero, one and multiple-owner boundaries independently of discovery or batching.
 * @evidence contracts/testing.md#distinguishing-cases Empty plans are the failure control; a singleton and a mixed ordinary/synthetic population are adjacent positive controls. Frozen arrays distinguish validation from mutation.
 * @evidence contracts/testing.md#execution-ownership The SDK direct unit runner discovers this matching export. It invokes the same guard used before integration preparation, with no installation, compilation, host or subprocess.
 */
export const test_sdk_nonempty_selection = (): void => {
  assert.throws(
    () => assertSdkFeaturesSelected(Object.freeze([])),
    /No test-sdk features selected.*--only.*--from.*--shard/,
  );
  for (const names of [
    Object.freeze(["http-rich"]),
    Object.freeze(["ordinary", "synthetic-cohort", "swagger-watch"]),
  ]) {
    const expected = [...names];
    assert.doesNotThrow(() => assertSdkFeaturesSelected(names));
    assert.deepEqual(names, expected);
  }
};
