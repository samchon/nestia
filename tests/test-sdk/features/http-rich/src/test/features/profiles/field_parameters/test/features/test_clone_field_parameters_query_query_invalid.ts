import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies an invalid boolean query field rejects before the test completes.
 *
 * TypedQuery runtime rejection must arrive through the generated SDK as an HTTP
 * failure.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the enforce field alone changes from boolean to something while the
 *    other fields remain valid; the request must reject with HTTP 400 and its
 *    validator promise is awaited.
 *
 * @evidence contracts/testing.md#behavioral-verification HTTP400 when only enforce changes to invalid something are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases HTTP400 when only enforce changes to invalid something define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_query_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.http_rich.options.field_parameters.query.query.typed(
      connection,
      {
        limit: 10,
        enforce: "something" as any,
        values: ["a", "b", "c"],
        atomic: "atomic",
      },
    ),
  );
};
