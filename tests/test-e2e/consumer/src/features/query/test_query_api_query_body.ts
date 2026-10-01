import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IQueryQuery } from "../../oracle/query/structures/IQueryQuery";

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
 * @evidence contracts/testing.md#behavioral-verification Generated query.body must return exactly atomic/limit10/enforce:true/two ordered values and the exact IQueryQuery shape.
 * @evidence contracts/testing.md#independent-expectations Explicit input and authored echo handler provide independent expected values; installed typia adds shape validation rather than manufacturing expected payloads.
 * @evidence contracts/testing.md#distinguishing-cases Scalar and repeated string values in urlencoded POST body contrast URL query parsing. Exact equality rejects scalar coercion loss, dropped array members or altered order.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Generated form body encoding, TypedQuery.Body parsing and querified response decoding must connect; a URLSearchParams unit alone cannot certify the full request.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_query_api_query_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQueryQuery = {
    atomic: "atomic",
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQueryQuery = await api.functional.query.query.body(
    connection,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("body", result, input);
};
