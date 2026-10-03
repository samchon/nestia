import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { IQueryFieldsQuery } from "../../../../../../structures/options/field_parameters/IQueryFieldsQuery";
import api from "../../api";

/**
 * Verifies Nest Query string fields are emitted and converted into the
 * controller DTO.
 *
 * Generated IQueryFieldsNestQuery string serialization and the Nest Query
 * parser connect over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert authored numeric and boolean strings and repeated values convert to
 *    the independently supplied IQueryFieldsQuery object with exact equality.
 *
 * @evidence contracts/testing.md#behavioral-verification Exact typed DTO equality after authored string-number/boolean and repeated-array Nest query conversion are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases Exact typed DTO equality after authored string-number/boolean and repeated-array Nest query conversion define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQueryFieldsQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQueryFieldsQuery =
    await api.functional.http_rich.options.field_parameters.query.query.nest(
      connection,
      {
        limit: input.limit ? `${input.limit}` : undefined,
        enforce: input.enforce ? "true" : "false",
        atomic: input.atomic ? input.atomic : "null",
        values: input.values ?? [],
      },
    );
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
