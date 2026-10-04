import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { QueryTrueIQuery } from "../../../../structures/query_true/QueryTrueIQuery";

/**
 * Verifies plain Nest query arrays survive absent, scalar and repeated wire
 * shapes.
 *
 * The generated SDK omits empty arrays and repeats keys for multiple elements;
 * the actual Nest parser and compiled response serializer must agree on the
 * DTO.
 *
 * 1. Send empty, singleton and repeated arrays with zero, false and null strings.
 * 2. Assert exact array preservation and the independently authored scalar DTO.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual generated SDK requests reach the plain Nest query route and its compiled response serializer; exact DTO assertions reject false HTTP500 responses and lost array elements.
 * @evidence contracts/testing.md#independent-expectations Literal arrays and the fixture's declared number, boolean and null conversion contract supply expected values independently of response output.
 * @evidence contracts/testing.md#distinguishing-cases Empty, singleton and repeated arrays distinguish absent, scalar and array parser shapes; zero, false and null distinguish conversion from truthiness. The original Nest case retains ordinary nonzero and nonnull inputs.
 * @evidence contracts/testing.md#execution-ownership This matching authored case is discovered by the shared installed HTTP consumer; it performs no installation, compilation or host creation.
 * @evidence contracts/e2e.md#necessary-boundary Generated query encoding, actual Nest extraction and the native response serializer connect over HTTP; direct array normalization cannot prove their agreement.
 * @evidence contracts/e2e.md#shared-execution All three requests reuse the rich fixture's one installed graph, producer, generated consumer and backend alongside the other query cases.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The stateless uniquely routed controller retains no request state; literal inputs cannot depend on prior responses and the shared runner owns host cleanup.
 * @evidence contracts/e2e.md#preserved-coverage This adds absent and singleton boundary assertions to the seven unchanged original query cases; repeated values remain a positive control rather than replacing prior coverage.
 */
export const test_api_query_true_nest_arrays = async (
  connection: api.IConnection,
): Promise<void> => {
  for (const values of [[], ["one"], ["one", "two"]]) {
    const result = await api.functional.http_rich.query_true.nest(connection, {
      limit: "0",
      enforce: "false",
      atomic: "null",
      values,
    });
    typia.assertEquals<QueryTrueIQuery>(result);
    TestValidator.equals(`nest array length ${values.length}`, result, {
      limit: 0,
      enforce: false,
      atomic: null,
      values,
    });
  }
};
