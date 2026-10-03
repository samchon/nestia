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
 * @evidence contracts/testing.md#behavioral-verification Nullable tagged date paths echo2024-02-29, preserve explicit null and reject20140102.
 * @evidence contracts/testing.md#independent-expectations The declared date-or-null domain permits both authored alternatives but excludes delimiter-free date text.
 * @evidence contracts/testing.md#distinguishing-cases Both valid date and null are required; the adjacent malformed-date spelling still rejects.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value =
    await api.functional.http_rich.options.request_validate.param.date_nullable(
      connection,
      date,
    );
  TestValidator.equals("date", date, value);

  TestValidator.equals(
    "null",
    await api.functional.http_rich.options.request_validate.param.date_nullable(
      connection,
      null,
    ),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.http_rich.options.request_validate.param.date_nullable(
      connection,
      "20140102",
    ),
  );
};
