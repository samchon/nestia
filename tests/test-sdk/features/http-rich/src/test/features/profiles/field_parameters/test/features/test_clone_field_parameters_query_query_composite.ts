import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { IQueryFieldsQuery } from "../../../../../../structures/options/field_parameters/IQueryFieldsQuery";
import api from "../../api";

/**
 * Verifies a named scalar query and a DTO query combine without losing either.
 *
 * Generated query-field and DTO argument serialization must reach their
 * distinct controller parameters.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the independent expected object combines atomic with the supplied
 *    limit, enforce and two values, retaining all declared fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Exact named atomic plus omitted-property DTO composition and resulting DTO shape are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases Exact named atomic plus omitted-property DTO composition and resulting DTO shape define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_query_composite = async (
  connection: api.IConnection,
): Promise<void> => {
  const atomic: string = "atomic";
  const input: Omit<IQueryFieldsQuery, "atomic"> = {
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQueryFieldsQuery =
    await api.functional.http_rich.options.field_parameters.query.query.composite(
      connection,
      atomic,
      input,
    );
  typia.assertEquals(result);
  TestValidator.equals("composite", result, { ...input, atomic });
};
