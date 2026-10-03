import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a date-formatted path value echoes and invalid date spellings fail.
 *
 * The generated client and tagged native path validator are connected by a real
 * request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert a valid date string must echo exactly, while null and the
 *    delimiter-free 20140102 spelling must throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Tagged date path requests echo2024-02-29 and reject null and delimiter-free20140102.
 * @evidence contracts/testing.md#independent-expectations The authored leap-day literal and date-format contract distinguish accepted input from null or non-date spelling.
 * @evidence contracts/testing.md#distinguishing-cases A valid leap day contrasts with null and missing delimiters; successful output equals the exact input.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = "2024-02-29";
  const value =
    await api.functional.http_rich.options.request_validate.param.date(
      connection,
      date,
    );
  TestValidator.equals("date", date, value);

  await TestValidator.error("null", () =>
    api.functional.http_rich.options.request_validate.param.date(
      connection,
      null!,
    ),
  );
  await TestValidator.error("invalid", () =>
    api.functional.http_rich.options.request_validate.param.date(
      connection,
      "20140102",
    ),
  );
};
