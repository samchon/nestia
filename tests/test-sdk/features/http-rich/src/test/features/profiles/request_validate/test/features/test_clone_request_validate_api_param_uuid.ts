import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../../api";

/**
 * Verifies a UUID path echoes while null and malformed UUID text are rejected.
 *
 * Generated path transport and the native UUID format tag must agree.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the supplied UUID must be returned unchanged; null and 12345678 must
 *    throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Tagged UUID path requests echo the supplied v4 UUID and reject null or12345678.
 * @evidence contracts/testing.md#independent-expectations The supplied UUID establishes equality, while the UUID format domain excludes null and the authored malformed short text.
 * @evidence contracts/testing.md#distinguishing-cases Valid UUID, null and short invalid text distinguish the required UUID format with exact return equality.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Only genuinely different native request validation or response serialization options have distinct producer programs; same-option inputs reuse them.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and option configurations remain, with only private identities and artifact/source addresses rebased. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_uuid = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value =
    await api.functional.http_rich.options.request_validate.param.uuid(
      connection,
      uuid,
    );
  TestValidator.equals("uuid", uuid, value);

  await TestValidator.error("null", () =>
    api.functional.http_rich.options.request_validate.param.uuid(
      connection,
      null!,
    ),
  );
  await TestValidator.error("invalid", () =>
    api.functional.http_rich.options.request_validate.param.uuid(
      connection,
      "12345678",
    ),
  );
};
