import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies api query body through its generated consumer.
 *
 * Scalar and repeated string values in urlencoded POST body contrast URL query
 * parsing. Exact equality rejects scalar coercion loss, dropped array members
 * or altered order.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated query.body must return exactly atomic/limit10/enforce:true/two ordered values and the exact IQuery shape.
 * @evidence contracts/testing.md#independent-expectations Explicit input and authored echo handler provide independent expected values; installed typia adds shape validation rather than manufacturing expected payloads.
 * @evidence contracts/testing.md#distinguishing-cases Scalar and repeated string values in urlencoded POST body contrast URL query parsing. Exact equality rejects scalar coercion loss, dropped array members or altered order.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated form body encoding, TypedQuery.Body parsing and querified response decoding must connect; a URLSearchParams unit alone cannot certify the full request.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_query_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    atomic: "atomic",
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.body(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("body", result, input);
};
