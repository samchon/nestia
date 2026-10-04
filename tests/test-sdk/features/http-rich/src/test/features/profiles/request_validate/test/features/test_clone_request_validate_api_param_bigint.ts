import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";

/**
 * Verifies a bigint path parameter converts to the controller number result and
 * invalid spellings fail.
 *
 * Generated path encoding and native TypedParam bigint parsing must agree
 * across an HTTP request.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the controller returns Number(value), so 1n must return 1; boolean and
 *    nonnumeric string values must produce HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification The native bigint path parser and generated SDK return Number(1n)=1 and reject boolean/non-numeric inputs with HTTP400.
 * @evidence contracts/testing.md#independent-expectations Literal1 and native bigint-to-number conversion define the return, while boolean and nonnumeric spellings are outside the authored bigint domain.
 * @evidence contracts/testing.md#distinguishing-cases BigInt(1) succeeds; true and string fail with exact400, retaining the generated-return type assertion.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_bigint = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number =
    await api.functional.http_rich.options.request_validate.param.bigint(
      connection,
      BigInt(1),
    );
  typia.assert(value);
  TestValidator.equals("bigint conversion", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.http_rich.options.request_validate.param.bigint(
      connection,
      true as any,
    ),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.http_rich.options.request_validate.param.bigint(
      connection,
      "string" as any,
    ),
  );
};
