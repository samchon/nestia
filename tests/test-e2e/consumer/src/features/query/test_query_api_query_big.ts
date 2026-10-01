import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IBigQueryQuery } from "../../api/structures/IBigQueryQuery";

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
 * @evidence contracts/testing.md#behavioral-verification Generated big form-body request with value100n and nullable:null must return the exact input and IBigQueryQuery shape.
 * @evidence contracts/testing.md#independent-expectations The authored big handler echoes its input; handwritten bigint100/null establish expected decoded values independently of serializer output.
 * @evidence contracts/testing.md#distinguishing-cases Bigint numeric text and nullable literal contrast ordinary boolean/number/string query body fields. This accepted input does not certify bigint extremes or malformed numeric text.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated urlencoded body, native bigint/null parsing and querified response decoding must connect over HTTP; JSON DTO units cannot certify bigint form transport.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_query_api_query_big = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBigQueryQuery = {
    value: BigInt(100),
    nullable: null,
  };
  const result: IBigQueryQuery = await api.functional.query.query.big(
    connection,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
