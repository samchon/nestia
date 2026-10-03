import assert from "node:assert/strict";

import { DynamicExecutor } from "../../../../packages/e2e/lib";

/**
 * Verifies dynamicExecutor.assert and validate reject zero concurrency before
 * loading a location.
 *
 * A zero simultaneous budget cannot execute any queued task and is an invalid
 * public option.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert both public entrypoints reject zero with a nonexistent location,
 *    separating validation from filesystem discovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both DynamicExecutor entrypoints with zero concurrency and requires the documented positive-integer validation error.
 * @evidence contracts/testing.md#independent-expectations The positive-integer concurrency contract establishes the literal error expectation independently of filesystem discovery.
 * @evidence contracts/testing.md#distinguishing-cases Both entrypoints reject zero on a nonexistent location; matching the validation message distinguishes this from a later filesystem failure.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package executor case; fixture files exercise the resolver without product compilation, consumer installation or a host.
 */
export async function test_dynamic_executor_invalid_concurrency(): Promise<void> {
  const props = {
    location: "does-not-need-to-exist",
    parameters: () => [],
    prefix: "test",
    simultaneous: 0,
  };
  for (const entry of [DynamicExecutor.assert, DynamicExecutor.validate])
    await assert.rejects(() => entry(props), {
      message: "DynamicExecutor: simultaneous must be a positive integer.",
    });
}
