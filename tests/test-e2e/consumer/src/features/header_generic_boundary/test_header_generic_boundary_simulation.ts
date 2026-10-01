import { HttpError } from "@nestia/fetcher";
import assert from "node:assert/strict";

import api from "../../api";
import propagated from "../../api_propagate";

/**
 * Verifies real and generated simulated UUID header validation agree.
 *
 * A UUID path parameter and range/permission failures do not exercise the
 * TypedHeaders simulator validation branch that originally accepted bad input.
 *
 * 1. Check the valid real echo before submitting malformed UUID headers.
 * 2. Retain both plain400 rejections and propagated false/status400 results.
 * 3. Check valid simulation, real recovery and unchanged caller headers.
 *
 * @evidence contracts/testing.md#behavioral-verification Plain real/simulated malformed headers must reject installed HttpError400; propagated real/simulated malformed headers must resolve success:false/status400. Valid simulated plain output is string and propagated output succeeds; real UUID echoes before and after failure.
 * @evidence contracts/testing.md#independent-expectations The copied original ISimulateHeaders UUID tag and echo handler establish literal input acceptance, HTTP400 and plain versus propagated error shape. Random simulated string contents are not prescribed.
 * @evidence contracts/testing.md#distinguishing-cases Real/simulated execution, malformed/valid UUIDs and thrown/resolved errors preserve the original six calls and eight verdicts. Real valid recovery and caller-object equality supplement the original boundaries.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this matching export and awaits its generated primary and propagated SDK requests; separate specimen failures are aggregated.
 * @evidence contracts/e2e.md#necessary-boundary Installed native TypedHeaders validation, actual HTTP decoding and generated simulator validation must connect. Direct metadata assertions cannot establish the emitted validation's rejection.
 * @evidence contracts/e2e.md#shared-execution Primary simulate:true and alternate propagate:true SDKs reuse the existing producer, generation phases, consumer compilation and Express/Fastify backend sessions; this case adds none.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The boundary route is stateless and uniquely prefixed. Fresh local connection/header objects isolate simulate options; all requests settle before the common owner closes the host.
 * @evidence contracts/e2e.md#preserved-coverage Original simulate-headers and simulate-headers-propagate retain their two malformed modes and valid simulated controls here. Recovery strengthens coverage without replacing any original verdict; execution remains pending.
 */
export const test_header_generic_boundary_simulation = async (
  connection: api.IConnection,
): Promise<void> => {
  const plain = api.functional.header_generic_boundary.simulate.headers.get;
  const propagate =
    propagated.functional.header_generic_boundary.simulate.headers.get;
  const good = { "x-id": "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69" };
  const bad = { "x-id": "not-a-uuid" };
  const failures: Error[] = [];
  const check = async (
    name: string,
    operation: () => Promise<void>,
  ): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      failures.push(new Error(name, { cause: error }));
    }
  };
  await check("valid real before", async () => {
    assert.equal(
      await plain({ ...connection, headers: { ...good } }),
      good["x-id"],
    );
  });
  for (const simulate of [false, true]) {
    await check(`plain malformed ${simulate}`, async () => {
      await assert.rejects(
        () => plain({ ...connection, simulate, headers: bad }),
        (error: unknown) => error instanceof HttpError && error.status === 400,
      );
    });
    await check(`propagated malformed ${simulate}`, async () => {
      const output = await propagate({ ...connection, simulate, headers: bad });
      assert.equal(output.success, false);
      assert.equal(output.status, 400);
    });
  }
  await check("valid plain simulated", async () => {
    assert.equal(
      typeof (await plain({ ...connection, simulate: true, headers: good })),
      "string",
    );
  });
  await check("valid propagated simulated", async () => {
    const output = await propagate({
      ...connection,
      simulate: true,
      headers: good,
    });
    assert.equal(output.success, true);
  });
  await check("valid real recovery", async () => {
    assert.equal(await plain({ ...connection, headers: good }), good["x-id"]);
  });
  assert.deepEqual(good, { "x-id": "7a1c7b36-0f6e-4c55-9b1e-1f2d3c4b5a69" });
  assert.deepEqual(bad, { "x-id": "not-a-uuid" });
  if (failures.length)
    throw new AggregateError(failures, "UUID header validation");
};
