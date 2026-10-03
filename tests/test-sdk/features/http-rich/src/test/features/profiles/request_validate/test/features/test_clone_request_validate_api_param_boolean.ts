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
 * @evidence contracts/testing.md#behavioral-verification Boolean path requests retain a boolean false result, parse zero/one as false/true and reject two/nonnumeric text with HTTP400.
 * @evidence contracts/testing.md#independent-expectations The supported boolean path domain independently maps0/1 to false/true; authored2 and string lie outside it.
 * @evidence contracts/testing.md#distinguishing-cases False, zero and one cover accepted spellings; two and string pin both numeric and nonnumeric rejection.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean =
    await api.functional.http_rich.options.request_validate.param.boolean(
      connection,
      false,
    );
  typia.assert(value);

  TestValidator.equals(
    "false",
    false,
    await api.functional.http_rich.options.request_validate.param.boolean(
      connection,
      0 as any,
    ),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.http_rich.options.request_validate.param.boolean(
      connection,
      1 as any,
    ),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.http_rich.options.request_validate.param.boolean(
      connection,
      2 as any,
    ),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.http_rich.options.request_validate.param.boolean(
      connection,
      "string" as any,
    ),
  );
};
