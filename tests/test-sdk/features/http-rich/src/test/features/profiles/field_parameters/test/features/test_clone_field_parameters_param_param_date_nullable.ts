import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a nullable date path preserves both the date and null alternatives.
 *
 * The HTTP path spelling for null must agree with nullable native validation.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert date equality and an explicit null result preserve the declared
 *    nullable domain; 20140102 remains invalid.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored leap-day and null echoes versus delimiter-free invalid date rejection are checked by the actual original assertions.
 * @evidence contracts/testing.md#independent-expectations The original authored literals and controller conversions define the oracle; fresh output is observed rather than copied into expected results.
 * @evidence contracts/testing.md#distinguishing-cases The authored leap-day and null echoes versus delimiter-free invalid date rejection define the original case distinctions and failure controls. Complementary field, null and malformed-input controls execute in this same profile.
 * @evidence contracts/testing.md#execution-ownership The matching export is discovered in the shared compiled consumer; its original complete body invokes the freshly generated profile SDK or reads its new document.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorators, freshly generated installed SDK and HTTP transport must agree. Direct writer units cannot prove this compiled metadata and consumer connection.
 * @evidence contracts/e2e.md#shared-execution Parameter and query controllers have equivalent generation options and share this one graph, installed dependencies, default producer, single consumer compilation and actual listener.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private DTO/controller/route identities separate the two original inputs. Stateless echoes and the fresh profile document retain no cross-case state. The runner application finally releases the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original operation, import, authored value and assertion remains apart from private identities and generated artifact paths; neither original wrapper adds behavior assertions.
 */
export const test_clone_field_parameters_param_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value =
    await api.functional.http_rich.options.field_parameters.param.param.date_nullable(
      connection,
      date,
    );
  TestValidator.equals("date", date, value!);

  TestValidator.equals(
    "null",
    await api.functional.http_rich.options.field_parameters.param.param.date_nullable(
      connection,
      null,
    ),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.http_rich.options.field_parameters.param.param.date_nullable(
      connection,
      "20140102",
    ),
  );
};
