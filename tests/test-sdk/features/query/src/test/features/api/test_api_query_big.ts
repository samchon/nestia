import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBigQuery } from "@api/lib/structures/IBigQuery";

/**
 * Verifies api query big through its generated consumer.
 *
 * Bigint numeric text and nullable literal contrast ordinary
 * boolean/number/string query body fields. This accepted input does not certify
 * bigint extremes or malformed numeric text.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated big form-body request with value100n and nullable:null must return the exact input and IBigQuery shape.
 * @evidence contracts/testing.md#independent-expectations The authored big handler echoes its input; handwritten bigint100/null establish expected decoded values independently of serializer output.
 * @evidence contracts/testing.md#distinguishing-cases Bigint numeric text and nullable literal contrast ordinary boolean/number/string query body fields. This accepted input does not certify bigint extremes or malformed numeric text.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated urlencoded body, native bigint/null parsing and querified response decoding must connect over HTTP; JSON DTO units cannot certify bigint form transport.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_query_big = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBigQuery = {
    value: BigInt(100),
    nullable: null,
  };
  const result: IBigQuery = await api.functional.query.big(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
