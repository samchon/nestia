import assert from "node:assert/strict";
import typia from "typia";

import api from "../../api";

/**
 * Verifies custom regex and length divisibility tags across the
 * native-to-cloned request boundary.
 *
 * Custom TagBase extraction and generated parameter representations must
 * connect to an installed generated client; literal wire/status controls
 * distinguish metadata loss.
 *
 * 1. Exercise the original generated successful operation with independent values.
 * 2. Send adjacent malformed raw values, then verify a valid generated recovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated even-length hex requests return the original undefined value; nonhex and odd-length raw requests return 400, then valid generated hex recovers.
 * @evidence contracts/testing.md#independent-expectations The original regex permits hexadecimal characters and the divisibility tag requires even length. a0FF/00ab, a0FG and abc are independent literal controls; generated-type validation is an additional connection.
 * @evidence contracts/testing.md#distinguishing-cases Valid mixed-case hex, an even-length nonhex string and an odd-length hex string distinguish the two original custom tags. Recovery keeps the original void handler.
 * @evidence contracts/testing.md#execution-ownership This matching export runs in the shared consumer after public installed producer/generation/consumer compilation, once per actual adapter.
 * @evidence contracts/e2e.md#necessary-boundary Native custom TagBase metadata must survive SDK cloning and connect to emitted parameter validation and actual HTTP requests.
 * @evidence contracts/e2e.md#shared-execution The case uses the existing installed artifacts, two rich programs and adapter lifetimes; no preparation is created here.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Stateless original handlers and the clone_complex prefix isolate inputs; raw bodies are consumed and host teardown remains with the common entry.
 * @evidence contracts/e2e.md#preserved-coverage The original transaction GET remains in the complete fresh generated HTTP population. These literal controls strengthen the original authored-case-zero input; keyword ABI remains pending.
 */
export const test_clone_complex_custom_tags = async (
  connection: api.IConnection,
): Promise<void> => {
  const route =
    api.functional.clone_complex.v0.transaction.user.findTransactionsByUser;
  assert.equal(
    await route(connection, typia.assert<Parameters<typeof route>[1]>("a0FF")),
    undefined,
  );
  for (const value of ["a0FG", "abc"]) {
    const response = await fetch(
      `${connection.host}/clone_complex/v0/transaction/user/${value}`,
    );
    const status = response.status;
    await response.arrayBuffer();
    assert.equal(status, 400);
  }
  assert.equal(
    await route(connection, typia.assert<Parameters<typeof route>[1]>("00ab")),
    undefined,
  );
};
