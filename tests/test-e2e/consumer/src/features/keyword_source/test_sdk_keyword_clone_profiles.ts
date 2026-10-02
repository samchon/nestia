import assert from "node:assert/strict";

import cloned from "../../api_keyword_clone";
import propagated from "../../api_keyword_clone_propagate";

const wrong = { query: { value: 3 } };
// @ts-expect-error A named query's authored string field rejects numeric input.
const invalidCloned: Parameters<
  typeof cloned.functional.keyword_collision.shadow.query
>[1] = wrong;
// @ts-expect-error Propagation changes the result ABI, not the query field type.
const invalidPropagated: Parameters<
  typeof propagated.functional.keyword_collision.shadow.query
>[1] = wrong;
void invalidCloned;
void invalidPropagated;

/**
 * Verifies cloned keyword and propagated keyword retain separate caller/result
 * ABIs.
 *
 * Distinct generated options must connect to the original producer classes;
 * imported type equality alone cannot certify their actual caller ABI.
 *
 * 1. Compile the generated binding under its own profile and original DTO graph.
 * 2. Execute independent literal calls on the existing shared adapter backend.
 *
 * @evidence contracts/testing.md#behavioral-verification Both keyword profiles accept named query props and echo independent payloads; the propagated profile additionally returns success true/status200/data, while numeric DTO fields fail consumer typechecking.
 * @evidence contracts/testing.md#independent-expectations The original IShadow value is string, the handler echoes its decoded query, and GET uses HTTP200. The literal query envelopes are independent of either generated module.
 * @evidence contracts/testing.md#distinguishing-cases Plain clone and propagated clone use distinct imports; correct string props contrast numeric compile-negative values, and plain data contrasts the status/data envelope.
 * @evidence contracts/testing.md#execution-ownership One matching export is discovered by the ordinary installed shared consumer after its single compilation and awaited per adapter.
 * @evidence contracts/e2e.md#necessary-boundary Actual installed source metadata, generated bindings and HTTP requests must agree; pure writer tests cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution Four additional SDK outputs and one automatic source-ABI E2E generation reuse the existing producer/consumer compiler requests and installation. The nonclone profiles share one separately counted no-listen app; this case acquires no app or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Independent request values and scenario namespaces isolate calls; the common entry owns the sequential adapter backends and sandbox lifetime.
 * @evidence contracts/e2e.md#preserved-coverage This case owns the named profile/source bindings described here, alongside copied original collision/destructuring controls and separately preserved artifact assertions; it does not certify untransferred profiles from compile success.
 */

export const test_sdk_keyword_clone_profiles = async (
  connection: cloned.IConnection,
): Promise<void> => {
  const plain = { value: "keyword-cloned" };
  assert.deepEqual(
    await cloned.functional.keyword_collision.shadow.query(connection, {
      query: plain,
    }),
    plain,
  );
  const input = { value: "keyword-propagated" };
  const result = await propagated.functional.keyword_collision.shadow.query(
    connection,
    { query: input },
  );
  assert.equal(result.success, true);
  assert.equal(result.status, 200);
  if (!result.success) throw new Error("Expected propagated GET success.");
  assert.deepEqual(result.data, input);
};
