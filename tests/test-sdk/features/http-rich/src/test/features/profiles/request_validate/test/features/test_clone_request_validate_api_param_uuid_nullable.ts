import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../../api";

/**
 * Verifies a nullable UUID path accepts a UUID and null but rejects malformed
 * text.
 *
 * The SDK null spelling must reach the nullable tagged native parameter as
 * null.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored UUID echoes, null returns null, and 12345678 is rejected.
 *
 * @evidence contracts/testing.md#behavioral-verification Nullable UUID paths echo the supplied UUID, retain null and reject12345678.
 * @evidence contracts/testing.md#independent-expectations The declared UUID-or-null domain independently permits both values and excludes the short malformed text.
 * @evidence contracts/testing.md#distinguishing-cases Valid UUID and explicit null both succeed;12345678 must still reject under the nullable format.
 * @evidence contracts/testing.md#execution-ownership The matching shared consumer file/export is discovered after actual installed native production, original SDK generation and one consumer compilation; direct unit entries do not execute this transport connection.
 * @evidence contracts/e2e.md#necessary-boundary The validate:validate native TypedParam report ABI and actual SDK/HTTP or WebSocket transport must agree; a direct option test cannot prove the runtime error/callback connection.
 * @evidence contracts/e2e.md#shared-execution Installation, generation preparation, consumer compilation and upgraded Express listener are shared. Request and response validate connections share one validate/validate producer. Independent option-family choices remain in the core Go units; original runtime assertions retain their actual transport boundary.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private route and declaration identities retain original stateless/local request semantics. RPC connections keep their original finally teardown, and the shared upgraded listener belongs to runner cleanup; no earlier outcome supplies later expected values.
 * @evidence contracts/e2e.md#preserved-coverage Entire original inputs/case/helper/import populations and request-report or response-validation assertions remain. A shared validate/validate program combines the two runtime connections; core Go units retain independent request and response option choices. Original automatic E2E generation remains disabled; every authored request assertion stays enabled.
 */
export const test_clone_request_validate_api_param_uuid_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value =
    await api.functional.http_rich.options.request_validate.param.uuid_nullable(
      connection,
      uuid,
    );
  TestValidator.equals("uuid", uuid, value);

  TestValidator.equals(
    "null",
    await api.functional.http_rich.options.request_validate.param.uuid_nullable(
      connection,
      null,
    ),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.http_rich.options.request_validate.param.uuid_nullable(
      connection,
      "12345678",
    ),
  );
};
