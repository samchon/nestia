import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";

/**
 * Verifies boolean path conversion accepts false and the numeric 0/1 spellings
 * while rejecting other values.
 *
 * Generated path encoding and native TypedParam boolean parsing are exercised
 * together over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert false and zero return false, one returns true, and two or a nonboolean
 *    string produce HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification False and numeric zero/one echoes versus HTTP400 for two/nonnumeric boolean spellings are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases False and numeric zero/one echoes versus HTTP400 for two/nonnumeric boolean spellings define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_param_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean =
    await api.functional.http_rich.options.field_parameters.param.param.boolean(
      connection,
      false,
    );
  typia.assert(value);

  TestValidator.equals(
    "false",
    false,
    await api.functional.http_rich.options.field_parameters.param.param.boolean(
      connection,
      0 as any,
    ),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.http_rich.options.field_parameters.param.param.boolean(
      connection,
      1 as any,
    ),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.http_rich.options.field_parameters.param.param.boolean(
      connection,
      2 as any,
    ),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.http_rich.options.field_parameters.param.param.boolean(
      connection,
      "string" as any,
    ),
  );
};
