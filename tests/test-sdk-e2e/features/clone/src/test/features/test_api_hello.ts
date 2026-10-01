import typia from "typia";

import api from "@api";
import { GetHelloResponseDto } from "@api/lib/structures/GetHelloResponseDto";

/**
 * Verifies api hello through its generated consumer.
 *
 * The authored DTO and handler supply the observable response contract.
 *
 * 1. Send the retained request through the generated SDK.
 * 2. Validate the response shape or independent payload invariant.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated root getHello request must return a value satisfying the generated cloned GetHelloResponseDto contract, including its optional mutable/readonly message-array union.
 * @evidence contracts/testing.md#independent-expectations The authored AppController returns its GetHelloResponseDto with message type0/1 and optional payload; the cloned contract is checked by the installed validator. Shape-only random output does not independently guarantee every optional union branch executes.
 * @evidence contracts/testing.md#distinguishing-cases This pins successful cloned anonymous/local DTO exposure with optional arrays rather than an exact stable random payload. Dedicated clone optional/literal/tag cases own their precise boundaries and negatives.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects the cloned generated SDK, actual HTTP handler and native server/client validation; a declaration identity alone cannot prove the root accessor works over transport.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
 */
export const test_api_hello = async (
  connection: api.IConnection,
): Promise<void> => {
  const hello: GetHelloResponseDto = await api.functional.getHello(connection);
  typia.assert(hello);
};
