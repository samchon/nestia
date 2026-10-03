import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";

/**
 * Verifies numeric path conversion preserves one and rejects boolean and
 * nonnumeric strings.
 *
 * The generated SDK path and native TypedParam number validator meet at the
 * HTTP boundary.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the number echo controller must return 1, while boolean and nonnumeric
 *    string spellings must fail with HTTP 400.
 *
 * @evidence contracts/testing.md#behavioral-verification The native numeric path route echoes1 and rejects boolean/nonnumeric spellings with HTTP400 through the generated SDK.
 * @evidence contracts/testing.md#independent-expectations The authored number domain accepts literal1 and excludes true/string; equality fixes the expected result independently of typia.assert.
 * @evidence contracts/testing.md#distinguishing-cases Valid1 contrasts with true and string, and both rejected spellings retain exact400 status.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_number = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number =
    await api.functional.http_rich.options.request_validate.param.number(
      connection,
      1,
    );
  typia.assert(value);
  TestValidator.equals("number echo", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.http_rich.options.request_validate.param.number(
      connection,
      true as any,
    ),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.http_rich.options.request_validate.param.number(
      connection,
      "string" as any,
    ),
  );
};
